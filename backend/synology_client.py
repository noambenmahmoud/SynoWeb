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


SYNO_AUTH_ERRORS = {
    400: "Identifiant ou mot de passe incorrect",
    401: "Compte désactivé",
    402: "Permission refusée",
    403: "Vérification en 2 étapes requise (non encore prise en charge)",
    404: "Code OTP invalide",
    406: "Vérification en 2 étapes obligatoire",
    407: "Adresse IP bloquée",
    408: "Mot de passe expiré (changement requis)",
    409: "Mot de passe doit être changé",
}


class SynologyError(Exception):
    def __init__(self, code: int, message: str = ""):
        super().__init__(message or f"Synology error {code}")
        self.code = code

    def friendly(self) -> str:
        if self.code in SYNO_AUTH_ERRORS:
            return SYNO_AUTH_ERRORS[self.code]
        return str(self) or f"Erreur Synology (code {self.code})"


class SynologyClient:
    def __init__(self, base_url: str, verify_ssl: bool = False, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.sid: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                verify=self.verify_ssl,
                timeout=self.timeout,
                follow_redirects=True,
            )
        return self._client

    async def _resolve_quickconnect(self) -> None:
        """Resolve a QuickConnect URL (e.g. https://quickconnect.to/<id>) to the
        actual NAS endpoint via SYNO global+regional resolvers."""
        from urllib.parse import urlparse
        parsed = urlparse(self.base_url)
        host = (parsed.hostname or "").lower()
        if "quickconnect.to" not in host:
            return
        server_id = (parsed.path or "").strip("/").split("/")[0]
        if not server_id:
            return
        client = await self._ensure_client()

        async def query(resolver_host: str, command: str = "request_tunnel") -> dict:
            r = await client.post(
                f"https://{resolver_host}/Serv.php",
                json={
                    "version": 1,
                    "command": command,
                    "stop_when_error": "false",
                    "stop_when_success": "false",
                    "id": "dsm_portal_https",
                    "serverID": server_id,
                },
                timeout=15.0,
            )
            return r.json()

        # 1) Hit global resolver, follow regional redirects.
        # Use "request_tunnel" so the response also contains relay endpoints
        # (used when direct ports aren't reachable — like mobile QuickConnect).
        resolvers_tried: set[str] = set()
        data: dict = {}
        try:
            data = await query("global.quickconnect.to")
            resolvers_tried.add("global.quickconnect.to")
            for _ in range(3):
                if data.get("errno") == 0:
                    break
                sites = data.get("sites") or []
                next_host = next((s for s in sites if s not in resolvers_tried), None)
                if not next_host:
                    break
                resolvers_tried.add(next_host)
                data = await query(next_host)
        except Exception as e:
            raise SynologyError(-1, f"Résolution QuickConnect échouée: {e}")

        if data.get("errno") != 0:
            raise SynologyError(-1, f"QuickConnect introuvable pour '{server_id}'")

        server = data.get("server") or {}
        service = data.get("service") or {}
        port = service.get("port") or 5001
        smartdns = data.get("smartdns") or {}

        # Build ordered candidate list. Try the Synology RELAY first because
        # most home NAS aren't directly exposed on the internet, so the mobile
        # apps (and we) must tunnel via Synology's relay servers.
        candidates: list[str] = []
        relay_dn = service.get("relay_dn")
        relay_port = service.get("relay_port")
        if relay_dn and relay_port:
            candidates.append(f"https://{relay_dn}:{relay_port}")
        relay_ip = service.get("relay_ip")
        if relay_ip and relay_port:
            candidates.append(f"https://{relay_ip}:{relay_port}")
        # Then fall back to direct endpoints
        if smartdns.get("host"):
            candidates.append(f"https://{smartdns['host']}:{port}")
        ddns = server.get("ddns")
        if ddns and ddns != "NULL":
            candidates.append(f"https://{ddns}:{port}")
        ext_ip = (server.get("external") or {}).get("ip")
        if ext_ip:
            candidates.append(f"https://{ext_ip}:{port}")

        if not candidates:
            raise SynologyError(-1, "QuickConnect n'a renvoyé aucun endpoint joignable")

        # Probe each candidate (short timeout — fail fast)
        last_err: Exception | None = None
        for url in candidates:
            try:
                ping = await client.get(
                    f"{url}/webapi/query.cgi",
                    params={"api": "SYNO.API.Info", "version": "1", "method": "query"},
                    timeout=5.0,
                )
                if ping.status_code < 500:
                    self.base_url = url
                    return
            except Exception as e:
                last_err = e
                continue
        endpoints_str = ", ".join(candidates)
        raise SynologyError(
            -1,
            (
                f"QuickConnect a bien identifié votre NAS '{server_id}' mais aucun de ses "
                f"points d'entrée n'est joignable depuis Internet ({endpoints_str}). "
                "Causes habituelles : port 5001 non redirigé sur votre routeur, NAS éteint/"
                "en veille, ou QuickConnect Relay désactivé. Solutions : "
                "1) DSM → Panneau de configuration → Accès externe → activez QuickConnect "
                "et vérifiez qu'il est en ligne ; "
                "2) Configurez la redirection du port 5001 sur votre box ; "
                "3) Saisissez directement l'URL DDNS (ex: https://Noamben.synology.me:5001) "
                "ou l'IP publique avec le port forwardé."
            ),
        )

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

    async def login(self, username: str, password: str, otp_code: str = "") -> str:
        # If user pasted a quickconnect.to URL, resolve it first
        await self._resolve_quickconnect()
        params = {
            "api": "SYNO.API.Auth",
            "version": "6",
            "method": "login",
            "account": username,
            "passwd": password,
            "session": "FileStation",
            "format": "sid",
        }
        if otp_code:
            params["otp_code"] = otp_code
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
