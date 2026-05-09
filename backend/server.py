"""FastAPI server for the Synology Cloud Dashboard."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Literal

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from mock_data import (
    DEMO_DOCUMENTS, DEMO_FOLDERS, DEMO_PHOTOS, DEMO_STORAGE, DEMO_VIDEOS, all_files,
)
from synology_client import SynologyClient, SynologyError
from ai_search import parse_query

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

app = FastAPI(title="Synology Cloud Dashboard")
api = APIRouter(prefix="/api")

# In-memory session store: token -> {"client": SynologyClient | None, "demo": bool, "username": str, "url": str}
SESSIONS: dict[str, dict] = {}


# ----- Models -----
class LoginRequest(BaseModel):
    nas_url: str = ""
    username: str = ""
    password: str = ""
    demo: bool = False


class LoginResponse(BaseModel):
    token: str
    demo: bool
    username: str
    nas_url: str


class FavoriteIn(BaseModel):
    file_id: str
    name: str
    type: str
    path: str = ""
    thumbnail: str = ""


# ----- Helpers -----
def get_session(authorization: Optional[str]) -> dict:
    if not authorization:
        raise HTTPException(401, "Non authentifié")
    token = authorization.replace("Bearer ", "").strip()
    sess = SESSIONS.get(token)
    if not sess:
        raise HTTPException(401, "Session invalide")
    return sess


def filter_demo(items: list[dict], q: dict) -> list[dict]:
    """Filter mock items by parsed AI query."""
    keywords = [k.lower() for k in q.get("keywords") or []]
    folder_hint = (q.get("folder_hint") or "").lower()
    types = set(q.get("types") or [])
    date_from = q.get("date_from")
    date_to = q.get("date_to")
    out = []
    for it in items:
        if types and it.get("type") not in types:
            continue
        haystack = (it.get("name", "") + " " + it.get("folder", "")).lower()
        if keywords and not any(k in haystack for k in keywords):
            continue
        if folder_hint and folder_hint not in (it.get("folder", "").lower()):
            continue
        if date_from or date_to:
            mod = it.get("modified", "")[:10]
            if date_from and mod < date_from:
                continue
            if date_to and mod > date_to:
                continue
        out.append(it)
    return out


# ----- Routes -----
@api.get("/")
async def root():
    return {"message": "Synology Cloud Dashboard API", "status": "ok"}


@api.post("/auth/synology/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    token = uuid.uuid4().hex
    if payload.demo or (not payload.nas_url and not payload.username):
        SESSIONS[token] = {
            "client": None, "demo": True,
            "username": payload.username or "demo",
            "url": "demo://local",
        }
        return LoginResponse(token=token, demo=True, username="demo", nas_url="demo://local")

    if not (payload.nas_url and payload.username and payload.password):
        raise HTTPException(400, "URL, identifiant et mot de passe requis")

    client = SynologyClient(payload.nas_url)
    try:
        await client.login(payload.username, payload.password)
    except SynologyError as e:
        raise HTTPException(401, e.friendly())
    except Exception as e:
        raise HTTPException(502, f"Impossible de joindre le NAS: {e}")

    SESSIONS[token] = {
        "client": client, "demo": False,
        "username": payload.username, "url": payload.nas_url,
    }
    return LoginResponse(token=token, demo=False, username=payload.username, nas_url=payload.nas_url)


@api.post("/auth/synology/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if not authorization:
        return {"ok": True}
    token = authorization.replace("Bearer ", "").strip()
    sess = SESSIONS.pop(token, None)
    if sess and sess.get("client"):
        try:
            await sess["client"].logout()
        except Exception:
            pass
    return {"ok": True}


@api.get("/auth/me")
async def me(authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    return {"username": sess["username"], "nas_url": sess["url"], "demo": sess["demo"]}


# ----- Photos / Videos / Documents (demo-aware) -----
@api.get("/photos")
async def list_photos(authorization: Optional[str] = Header(None), folder: Optional[str] = None):
    sess = get_session(authorization)
    if sess["demo"]:
        items = DEMO_PHOTOS
        if folder:
            items = [p for p in items if p["folder"].startswith(folder)]
        return {"items": items, "count": len(items)}
    # Real Synology: list common Photos share
    client: SynologyClient = sess["client"]
    target = folder or "/photo"
    try:
        files = await client.list_folder(target)
    except SynologyError:
        files = []
    items = []
    for f in files:
        if f.get("isdir"):
            continue
        name = f.get("name", "")
        if not name.lower().endswith((".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif")):
            continue
        path = f.get("path", "")
        items.append({
            "id": path,
            "name": name,
            "type": "photo",
            "thumbnail": f"/api/files/thumbnail?path={path}&size=medium",
            "url": f"/api/files/thumbnail?path={path}&size=large",
            "size": f.get("additional", {}).get("size", 0),
            "modified": _ts_to_iso(f.get("additional", {}).get("time", {}).get("mtime")),
            "folder": "/".join(path.split("/")[:-1]),
        })
    return {"items": items, "count": len(items)}


@api.get("/videos")
async def list_videos(authorization: Optional[str] = Header(None), folder: Optional[str] = None):
    sess = get_session(authorization)
    if sess["demo"]:
        items = DEMO_VIDEOS
        if folder:
            items = [v for v in items if v["folder"].startswith(folder)]
        return {"items": items, "count": len(items)}
    client: SynologyClient = sess["client"]
    target = folder or "/video"
    try:
        files = await client.list_folder(target)
    except SynologyError:
        files = []
    items = []
    for f in files:
        if f.get("isdir"):
            continue
        name = f.get("name", "")
        if not name.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v")):
            continue
        path = f.get("path", "")
        items.append({
            "id": path,
            "name": name,
            "type": "video",
            "thumbnail": f"/api/files/thumbnail?path={path}&size=medium",
            "url": f"/api/files/stream?path={path}",
            "size": f.get("additional", {}).get("size", 0),
            "modified": _ts_to_iso(f.get("additional", {}).get("time", {}).get("mtime")),
            "folder": "/".join(path.split("/")[:-1]),
        })
    return {"items": items, "count": len(items)}


@api.get("/documents")
async def list_documents(authorization: Optional[str] = Header(None), folder: Optional[str] = None):
    sess = get_session(authorization)
    if sess["demo"]:
        items = DEMO_DOCUMENTS
        if folder:
            items = [d for d in items if d["folder"].startswith(folder)]
        return {"items": items, "count": len(items)}
    client: SynologyClient = sess["client"]
    target = folder or "/homes"
    try:
        files = await client.list_folder(target)
    except SynologyError:
        files = []
    exts = (".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".txt", ".md", ".csv", ".odt")
    items = []
    for f in files:
        if f.get("isdir"):
            continue
        name = f.get("name", "")
        if not name.lower().endswith(exts):
            continue
        path = f.get("path", "")
        items.append({
            "id": path,
            "name": name,
            "type": "document",
            "ext": name.rsplit(".", 1)[-1].lower(),
            "size": f.get("additional", {}).get("size", 0),
            "modified": _ts_to_iso(f.get("additional", {}).get("time", {}).get("mtime")),
            "folder": "/".join(path.split("/")[:-1]),
        })
    return {"items": items, "count": len(items)}


@api.get("/folders")
async def list_folders(authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    if sess["demo"]:
        return {"items": DEMO_FOLDERS}
    client: SynologyClient = sess["client"]
    try:
        shares = await client.list_shares()
    except SynologyError:
        shares = []
    return {"items": [{"path": s.get("path", ""), "name": s.get("name", ""), "count": 0} for s in shares]}


@api.get("/storage/info")
async def storage_info(authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    if sess["demo"]:
        return DEMO_STORAGE
    return DEMO_STORAGE  # Synology Core.System info often restricted; demo numbers as placeholder


# ----- AI Search -----
class SearchRequest(BaseModel):
    query: str


@api.post("/search/ai")
async def ai_search(payload: SearchRequest, authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    if not payload.query.strip():
        return {"parsed": None, "items": [], "summary": ""}
    parsed = await parse_query(payload.query)
    if sess["demo"]:
        results = filter_demo(all_files(), parsed)
        return {"parsed": parsed, "items": results, "summary": parsed.get("summary", "")}
    # Real NAS: search across major shares with first keyword as pattern
    client: SynologyClient = sess["client"]
    pattern = (parsed.get("keywords") or [payload.query])[0]
    try:
        files = await client.search_files("/", pattern)
    except SynologyError:
        files = []
    items = []
    for f in files[:200]:
        path = f.get("path", "")
        name = f.get("name", "")
        lower = name.lower()
        ftype = "document"
        if lower.endswith((".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif")):
            ftype = "photo"
        elif lower.endswith((".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v")):
            ftype = "video"
        items.append({
            "id": path, "name": name, "type": ftype,
            "thumbnail": f"/api/files/thumbnail?path={path}&size=medium" if ftype != "document" else "",
            "size": f.get("additional", {}).get("size", 0),
            "modified": _ts_to_iso(f.get("additional", {}).get("time", {}).get("mtime")),
            "folder": "/".join(path.split("/")[:-1]),
        })
    return {"parsed": parsed, "items": items, "summary": parsed.get("summary", "")}


# ----- File proxying (real NAS only) -----
@api.get("/files/thumbnail")
async def file_thumbnail(
    path: str,
    size: str = "medium",
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    sess = _resolve_session_for_proxy(authorization, token)
    if sess["demo"]:
        # In demo we serve direct unsplash URLs from item objects; this proxy isn't used.
        raise HTTPException(404, "Mode démo : pas de proxy")
    client: SynologyClient = sess["client"]
    return RedirectResponse(client.thumb_url(path, size=size))


@api.get("/files/stream")
async def file_stream(
    request: Request,
    path: str,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    sess = _resolve_session_for_proxy(authorization, token)
    if sess["demo"]:
        raise HTTPException(404, "Mode démo : pas de proxy")
    client: SynologyClient = sess["client"]
    range_header = request.headers.get("range")
    resp = await client.stream_download(path, range_header=range_header)

    async def body_iter():
        try:
            async for chunk in resp.aiter_bytes():
                yield chunk
        finally:
            await resp.aclose()

    headers = {k: v for k, v in resp.headers.items() if k.lower() in {
        "content-length", "content-type", "accept-ranges", "content-range"
    }}
    return StreamingResponse(body_iter(), status_code=resp.status_code, headers=headers)


# ----- Favorites (persisted in Mongo) -----
@api.get("/favorites")
async def list_favorites(authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    docs = await db.favorites.find({"user": sess["username"]}, {"_id": 0}).to_list(500)
    return {"items": docs}


@api.post("/favorites")
async def add_favorite(fav: FavoriteIn, authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    doc = fav.model_dump()
    doc["user"] = sess["username"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.favorites.update_one(
        {"user": sess["username"], "file_id": fav.file_id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/favorites/{file_id}")
async def remove_favorite(file_id: str, authorization: Optional[str] = Header(None)):
    sess = get_session(authorization)
    await db.favorites.delete_one({"user": sess["username"], "file_id": file_id})
    return {"ok": True}


# ----- Helpers -----
def _ts_to_iso(ts) -> str:
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).isoformat()
    except Exception:
        return ""


def _resolve_session_for_proxy(authorization: Optional[str], token: Optional[str]) -> dict:
    if authorization:
        return get_session(authorization)
    if token and token in SESSIONS:
        return SESSIONS[token]
    raise HTTPException(401, "Non authentifié")


# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown():
    for sess in list(SESSIONS.values()):
        if sess.get("client"):
            try:
                await sess["client"].close()
            except Exception:
                pass
    mongo_client.close()
