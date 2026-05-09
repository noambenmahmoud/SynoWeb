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
# Multi-token quality tags that survive dash/dot → space replacement
_QUALITY_2WORD = re.compile(
    r"\b("
    r"web\s*[-\s]*\s*dl|web\s*[-\s]*\s*rip|"
    r"blu\s*[-\s]*\s*ray|dvd\s*[-\s]*\s*rip|"
    r"hd\s*[-\s]*\s*rip|hd\s*[-\s]*\s*cam|hd\s*[-\s]*\s*ts|"
    r"true\s*[-\s]*\s*french|"
    r"10\s*[-\s]*\s*bit|"
    r"h\s*[-\s]*\s*264|h\s*[-\s]*\s*265|"
    r"5\s*\.?\s*1|7\s*\.?\s*1"
    r")\b",
    re.I,
)
_QUALITY = re.compile(
    r"\b("
    r"480p|720p|1080p|2160p|4k|hdr|sdr|10bit|hevc|h264|h265|x264|x265|av1|aac|ac3|"
    r"dts(-?hd)?|truehd|atmos|ddp|ddpa|"
    r"bluray|brrip|bdrip|webrip|webdl|dvdrip|hdrip|hdcam|hdtv|cam|"
    r"french|truefrench|vff|vfq|vostfr|multi|subfrench|"
    r"repack|proper|remux|extended|director'?s\.?cut|uncut|unrated|imax|"
    r"ettv|rarbg|yify|fgt|cmrg|nogrp|amzn|nf|hulu|dsnp|atvp"
    r")\b",
    re.I,
)
_NON_ALNUM = re.compile(r"[._\-]+")
_MULTI_SPACE = re.compile(r"\s+")
_TRAILING_TOKENS = re.compile(r"\s+(?:vff|vfq|vostfr|multi|french|truefrench|web|dl|rip)+$", re.I)

# Words that, on their own, mean nothing useful for a TMDB search
GENERIC_TITLES = {
    "", "movie", "video", "film", "films", "movies", "videos",
    "episode", "media", "trailer", "untitled", "scene", "scenes",
    "intro", "outro", "main", "titre",
}


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
    base = _QUALITY_2WORD.sub(" ", base)
    base = _QUALITY.sub(" ", base)
    base = _YEAR.sub(" ", base)
    base = _MULTI_SPACE.sub(" ", base).strip()
    # Strip trailing dangling quality tokens that survived
    prev = None
    while prev != base:
        prev = base
        base = _TRAILING_TOKENS.sub("", base).strip()
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

    # Build candidate parses. Filename takes priority; folder is used ONLY as
    # a fallback when filename gives a generic / empty title. This avoids
    # 50 movies all matching "video" and getting the same poster.
    fn_info = parse_filename(filename) if filename else None
    fd_info = parse_filename(folder_hint) if folder_hint else None

    def _useful(info: Optional[dict]) -> bool:
        if not info:
            return False
        t = (info.get("title") or "").strip().lower()
        if len(t) < 3:
            return False
        if t in GENERIC_TITLES:
            return False
        return True

    candidates: list[dict] = []
    if _useful(fn_info):
        candidates.append(fn_info)
    elif _useful(fd_info):
        candidates.append(fd_info)
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
