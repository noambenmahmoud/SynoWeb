"""
Lightweight async Synology DSM client.

Implements only the calls we need for browsing / streaming files:
  - SYNO.API.Auth (login / logout)
  - SYNO.FileStation.List (list_share, list)
  - SYNO.FileStation.Search
  - SYNO.FileStation.Thumb (image thumbnails)
  - SYNO.FileStation.Download (file download / range stream)
  - SYNO.Core.System for storage info (best effort)

Synology APIs accept query parameters and return JSON like:
  {"success": true, "data": {...}}
or {"success": false, "error": {"code": <int>}}.
"""
from __future__ import annotations

from typing import Any, Optional, AsyncIterator
import httpx


class SynologyError(Exception):
    def __init__(self, code: int, message: str = ""):
        super().__init__(message or f"Synology error {code}")
        self.code = code


class SynologyClient:
    def __init__(self, base_url: str, verify_ssl: bool = False, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.sid: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout)
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _get(self, path: str, params: dict[str, Any]) -> dict:
        client = await self._ensure_client()
        if self.sid and "_sid" not in params:
            params = {**params, "_sid": self.sid}
        url = f"{self.base_url}{path}"
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        if not data.get("success"):
            err = data.get("error", {})
            raise SynologyError(err.get("code", -1), str(err))
        return data.get("data", {})

    async def login(self, username: str, password: str) -> str:
        params = {
            "api": "SYNO.API.Auth",
            "version": "3",
            "method": "login",
            "account": username,
            "passwd": password,
            "session": "FileStation",
            "format": "sid",
        }
        data = await self._get("/webapi/auth.cgi", params)
        sid = data.get("sid")
        if not sid:
            raise SynologyError(-1, "No SID returned")
        self.sid = sid
        return sid

    async def logout(self) -> None:
        if not self.sid:
            return
        try:
            await self._get(
                "/webapi/auth.cgi",
                {"api": "SYNO.API.Auth", "version": "1", "method": "logout", "session": "FileStation"},
            )
        except Exception:
            pass
        self.sid = None
        await self.close()

    async def list_shares(self) -> list[dict]:
        data = await self._get(
            "/webapi/entry.cgi",
            {"api": "SYNO.FileStation.List", "version": "2", "method": "list_share", "limit": 1000},
        )
        return data.get("shares", [])

    async def list_folder(self, folder_path: str, limit: int = 1000) -> list[dict]:
        data = await self._get(
            "/webapi/entry.cgi",
            {
                "api": "SYNO.FileStation.List",
                "version": "2",
                "method": "list",
                "folder_path": folder_path,
                "additional": '["real_path","size","time","type"]',
                "limit": limit,
            },
        )
        return data.get("files", [])

    async def search_files(self, folder_path: str, pattern: str, file_type: str = "all") -> list[dict]:
        # Use start_search + list (simpler: list with filetype + pattern via list endpoint)
        data = await self._get(
            "/webapi/entry.cgi",
            {
                "api": "SYNO.FileStation.Search",
                "version": "2",
                "method": "start",
                "folder_path": folder_path,
                "pattern": pattern,
                "filetype": file_type,
            },
        )
        return data.get("files", [])

    def thumb_url(self, file_path: str, size: str = "medium") -> str:
        # size: small, medium, large, original
        from urllib.parse import urlencode
        params = {
            "api": "SYNO.FileStation.Thumb",
            "version": "2",
            "method": "get",
            "path": file_path,
            "size": size,
            "_sid": self.sid or "",
        }
        return f"{self.base_url}/webapi/entry.cgi?{urlencode(params)}"

    def download_url(self, file_path: str) -> str:
        from urllib.parse import urlencode
        params = {
            "api": "SYNO.FileStation.Download",
            "version": "2",
            "method": "download",
            "path": f'["{file_path}"]',
            "mode": "open",
            "_sid": self.sid or "",
        }
        return f"{self.base_url}/webapi/entry.cgi?{urlencode(params)}"

    async def stream_download(
        self, file_path: str, range_header: Optional[str] = None
    ) -> AsyncIterator[tuple[int, dict, AsyncIterator[bytes]]]:
        """Yields (status_code, headers, body_iter). Caller must close."""
        client = await self._ensure_client()
        url = self.download_url(file_path)
        headers = {}
        if range_header:
            headers["Range"] = range_header
        req = client.build_request("GET", url, headers=headers)
        resp = await client.send(req, stream=True)
        return resp

    async def storage_info(self) -> dict:
        try:
            data = await self._get(
                "/webapi/entry.cgi",
                {"api": "SYNO.Core.System", "version": "1", "method": "info"},
            )
            return data
        except Exception:
            return {}
