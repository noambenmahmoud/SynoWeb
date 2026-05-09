"""
SynoCloud Desktop — single-process entry point.

Launches an embedded FastAPI server on 127.0.0.1 and opens a native
window (via pywebview) pointed at it. The whole thing can be packaged
into a single executable with PyInstaller (see build.py).

Run interactively:
    python desktop/main.py
"""
from __future__ import annotations

import os
import socket
import sys
import threading
import time
import traceback
from pathlib import Path

# --- Path resolution: works both for `python desktop/main.py` and PyInstaller bundles
def _base_dir() -> Path:
    # When packaged with PyInstaller --onedir, sys._MEIPASS points to extracted resources
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent  # /app


BASE = _base_dir()
BACKEND_DIR = BASE / "backend"
FRONTEND_BUILD = BASE / "frontend" / "build"

# --- Configure environment BEFORE importing backend
os.environ.setdefault("LOCAL_MODE", "1")
data_dir = Path.home() / ".synocloud"
data_dir.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("DATA_DIR", str(data_dir))
os.environ.setdefault("FRONTEND_BUILD", str(FRONTEND_BUILD))

# Make backend modules importable
sys.path.insert(0, str(BACKEND_DIR))


def _free_port(default: int = 8765) -> int:
    """Return `default` if free, else any available port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", default))
            return default
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _start_server(port: int) -> None:
    import uvicorn  # noqa: WPS433
    from server import app  # noqa: WPS433
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


def _wait_ready(port: int, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.4)
            try:
                s.connect(("127.0.0.1", port))
                return True
            except OSError:
                time.sleep(0.2)
    return False


def main() -> int:
    try:
        import webview  # noqa: WPS433
    except ImportError:
        print("Erreur : pywebview non installé. Faites:  pip install -r desktop/requirements-desktop.txt", file=sys.stderr)
        return 2

    if not FRONTEND_BUILD.exists():
        print(f"Erreur : build frontend manquant à {FRONTEND_BUILD}.", file=sys.stderr)
        print("Executez :  cd frontend && yarn install && yarn build", file=sys.stderr)
        return 3

    port = _free_port()
    threading.Thread(target=_start_server, args=(port,), daemon=True).start()

    if not _wait_ready(port):
        print(f"Le serveur backend ne s'est pas lancé sur le port {port}.", file=sys.stderr)
        return 4

    url = f"http://127.0.0.1:{port}"
    try:
        webview.create_window(
            "SynoCloud",
            url,
            width=1400,
            height=900,
            min_size=(1024, 700),
            resizable=True,
            text_select=True,
        )
        webview.start(debug=False)
    except Exception:
        traceback.print_exc()
        return 5
    return 0


if __name__ == "__main__":
    sys.exit(main())
