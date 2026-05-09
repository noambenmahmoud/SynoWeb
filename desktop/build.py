"""
SynoCloud Desktop — PyInstaller build script.

Run from the project root (/app):
    python desktop/build.py

Outputs a single-folder distribution under ./dist/SynoCloud (with
SynoCloud.exe on Windows, SynoCloud.app on macOS, SynoCloud on Linux).
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_BUILD = ROOT / "frontend" / "build"

if not FRONTEND_BUILD.exists():
    print("[!] frontend/build introuvable.")
    print("    Build the frontend first :")
    print("       cd frontend && yarn install && yarn build")
    sys.exit(1)


def _data_arg(src: Path, dest: str) -> str:
    sep = ";" if os.name == "nt" else ":"
    return f"{src}{sep}{dest}"


def main() -> None:
    icon_args: list[str] = []
    icon_dir = ROOT / "desktop" / "assets"
    if (icon_dir / "icon.ico").exists() and platform.system() == "Windows":
        icon_args = ["--icon", str(icon_dir / "icon.ico")]
    elif (icon_dir / "icon.icns").exists() and platform.system() == "Darwin":
        icon_args = ["--icon", str(icon_dir / "icon.icns")]

    args = [
        sys.executable, "-m", "PyInstaller",
        "--name", "SynoCloud",
        "--noconfirm",
        "--clean",
        "--windowed",
        "--onedir",
        "--add-data", _data_arg(FRONTEND_BUILD, "frontend/build"),
        "--add-data", _data_arg(ROOT / "backend", "backend"),
        "--collect-all", "emergentintegrations",
        "--collect-submodules", "fastapi",
        "--collect-submodules", "starlette",
        "--collect-submodules", "uvicorn",
        "--collect-submodules", "anyio",
        "--collect-submodules", "h11",
        "--collect-submodules", "h2",
        "--collect-submodules", "webview",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "uvicorn.lifespan.off",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.http.h11_impl",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.loops.asyncio",
        *icon_args,
        str(ROOT / "desktop" / "main.py"),
    ]

    print("[+] Lancement de PyInstaller...")
    print("    " + " ".join(args))
    res = subprocess.run(args, cwd=ROOT)
    if res.returncode != 0:
        sys.exit(res.returncode)

    out_dir = ROOT / "dist" / "SynoCloud"
    print(f"[✓] Build terminé. Sortie : {out_dir}")
    print()
    print("Pour lancer l'app :")
    if platform.system() == "Windows":
        print(f"   {out_dir / 'SynoCloud.exe'}")
    elif platform.system() == "Darwin":
        print(f"   open {ROOT / 'dist' / 'SynoCloud.app'}")
    else:
        print(f"   {out_dir / 'SynoCloud'}")

    # Optional: clean up build artifacts (keep dist/)
    for trash in (ROOT / "build", ROOT / "SynoCloud.spec"):
        if trash.exists():
            try:
                if trash.is_dir():
                    shutil.rmtree(trash)
                else:
                    trash.unlink()
            except Exception:
                pass


if __name__ == "__main__":
    main()
