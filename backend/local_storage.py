"""Local JSON-based storage used in desktop mode (replaces MongoDB)."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path


class JsonFavoriteStore:
    """Small async wrapper that persists favorites to a single JSON file.

    Layout:
      {
        "<username>": [ {file_id, name, type, path, thumbnail, created_at}, ... ],
        ...
      }
    """

    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()

    def _read(self) -> dict:
        if not self.path.exists():
            return {}
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _write(self, data: dict) -> None:
        tmp = self.path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(self.path)

    async def list(self, user: str) -> list[dict]:
        async with self._lock:
            return list(self._read().get(user, []))

    async def add(self, user: str, fav: dict) -> None:
        async with self._lock:
            data = self._read()
            user_favs = [f for f in data.get(user, []) if f.get("file_id") != fav.get("file_id")]
            doc = {**fav, "user": user, "created_at": datetime.now(timezone.utc).isoformat()}
            user_favs.append(doc)
            data[user] = user_favs
            self._write(data)

    async def remove(self, user: str, file_id: str) -> None:
        async with self._lock:
            data = self._read()
            data[user] = [f for f in data.get(user, []) if f.get("file_id") != file_id]
            self._write(data)


class MongoFavoriteStore:
    """Async wrapper around an existing motor collection (cloud mode)."""

    def __init__(self, collection):
        self.col = collection

    async def list(self, user: str) -> list[dict]:
        return await self.col.find({"user": user}, {"_id": 0}).to_list(500)

    async def add(self, user: str, fav: dict) -> None:
        doc = dict(fav)
        doc["user"] = user
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await self.col.update_one(
            {"user": user, "file_id": fav["file_id"]},
            {"$set": doc},
            upsert=True,
        )

    async def remove(self, user: str, file_id: str) -> None:
        await self.col.delete_one({"user": user, "file_id": file_id})
