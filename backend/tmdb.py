"""TMDB integration: parse a media filename and fetch its poster URL."""
from __future__ import annotations

import asyncio
import os
import re
from typing import Optional

import httpx

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG = "https://image.tmdb.org/t/p/w500"

# Per-process cache. filename -> poster URL (or "" when not found)
_CACHE: dict[str, str] = {}
_LOCK = asyncio.Lock()
_SEMAPHORE = asyncio.Semaphore(5)

_BRACKETS = re.compile(r"[\[\(\{][^\[\]\(\)\{\}]*[\]\)\}]")
_TV_EP = re.compile(r"\bs(\d{1,2})\s*[ex]\s*(\d{1,2})\b", re.I)
_YEAR = re.compile(r"\b(19|20)\d{2}\b")
_QUALITY = re.compile(
    r"\b("
    r"480p|720p|1080p|2160p|4k|hdr|sdr|10bit|hevc|h\.?264|h\.?265|x264|x265|av1|aac|ac3|"
    r"dts(-?hd)?|truehd|atmos|ddp|ddpa|dd5\.?1|"
    r"bluray|blu-?ray|brrip|bdrip|webrip|web-?dl|dvdrip|hdrip|hdcam|hdtv|cam|"
    r"french|truefrench|vff|vfq|vostfr|multi|subfrench|fr|en|"
    r"repack|proper|remux|extended|directors?\.?cut|uncut|unrated|imax|"
    r"ettv|rarbg|yify|fgt|cmrg|nogrp"
    r")\b",
    re.I,
)
_NON_ALNUM = re.compile(r"[._\-]+")
_MULTI_SPACE = re.compile(r"\s+")


def parse_filename(filename: str) -> dict:
    """Return {"title", "is_tv", "year", "season", "episode"}."""
    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    base = _BRACKETS.sub(" ", base)
    base = _NON_ALNUM.sub(" ", base)

    is_tv = False
    season = episode = None
    m = _TV_EP.search(base)
    if m:
        is_tv = True
        season = int(m.group(1))
        episode = int(m.group(2))
        base = base[: m.start()]  # cut after "S01E02"

    year_m = _YEAR.search(base)
    year = year_m.group(0) if year_m else None
    base = _QUALITY.sub(" ", base)
    base = _YEAR.sub(" ", base)
    base = _MULTI_SPACE.sub(" ", base).strip()
    return {"title": base, "is_tv": is_tv, "year": year, "season": season, "episode": episode}


async def fetch_poster(filename: str, folder_hint: str = "") -> Optional[str]:
    """Return TMDB poster URL for the given media filename, or None.
    `folder_hint` is the parent folder name — used as fallback when filename
    is generic (e.g. Plex layout: "Inception (2010)/Inception.mkv")."""
    if not filename and not folder_hint:
        return None
    cache_key = f"{folder_hint}|{filename}"
    async with _LOCK:
        if cache_key in _CACHE:
            return _CACHE[cache_key] or None

    token = os.environ.get("TMDB_TOKEN")
    if not token:
        return None

    # Build candidate parses: filename first, then folder name as fallback
    candidates: list[dict] = []
    if filename:
        candidates.append(parse_filename(filename))
    if folder_hint:
        candidates.append(parse_filename(folder_hint))
    # Filter out empty or too-short titles
    candidates = [c for c in candidates if c["title"] and len(c["title"]) >= 2]
    if not candidates:
        async with _LOCK:
            _CACHE[cache_key] = ""
        return None

    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

    async def _search(endpoint: str, params: dict) -> Optional[str]:
        async with _SEMAPHORE:
            try:
                async with httpx.AsyncClient(timeout=8.0) as c:
                    r = await c.get(TMDB_BASE + endpoint, params=params, headers=headers)
                    if r.status_code != 200:
                        return None
                    data = r.json()
            except Exception:
                return None
        for res in (data.get("results") or [])[:1]:
            p = res.get("poster_path")
            if p:
                return TMDB_IMG + p
        return None

    poster: Optional[str] = None
    for info in candidates:
        title = info["title"]
        base_params = {"query": title, "language": "fr-FR", "include_adult": "false"}
        if info["is_tv"]:
            poster = await _search("/search/tv", base_params)
            if not poster:
                poster = await _search("/search/movie", base_params)
        else:
            params = dict(base_params)
            if info["year"]:
                params["year"] = info["year"]
            poster = await _search("/search/movie", params)
            if not poster:
                poster = await _search("/search/tv", base_params)
        if not poster:
            params_en = dict(base_params, language="en-US")
            poster = await _search("/search/movie", params_en) or await _search("/search/tv", params_en)
        if poster:
            break

    async with _LOCK:
        _CACHE[cache_key] = poster or ""
    return poster


async def fetch_posters(items: list[dict]) -> dict[str, Optional[str]]:
    """Resolve posters for many items concurrently. Each item is either a
    string (filename) or {"name": ..., "folder": ...} dict. Returns a map
    keyed by filename."""
    if not items:
        return {}
    pairs: list[tuple[str, str]] = []
    for it in items:
        if isinstance(it, str):
            pairs.append((it, ""))
        else:
            name = it.get("name", "")
            folder = (it.get("folder") or "").rstrip("/").split("/")[-1]
            pairs.append((name, folder))
    coros = [fetch_poster(n, f) for (n, f) in pairs]
    results = await asyncio.gather(*coros, return_exceptions=True)
    out: dict[str, Optional[str]] = {}
    for (name, _), res in zip(pairs, results):
        out[name] = res if isinstance(res, str) else None
    return out
