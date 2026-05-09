"""On-the-fly HLS transcoding via ffmpeg.

Each session = one ffmpeg process producing segmented .ts files in a temp
directory. The frontend (hls.js) polls the playlist + segments through the
backend, which means the browser never needs direct access to the NAS.
"""
from __future__ import annotations

import asyncio
import shutil
import time
import uuid
from pathlib import Path
from tempfile import gettempdir
from typing import Optional


SESSION_TTL_SECONDS = 60 * 30  # 30 min idle then GC


class HlsSession:
    def __init__(self, work_dir: Path, proc: asyncio.subprocess.Process):
        self.id = work_dir.name
        self.work_dir = work_dir
        self.proc = proc
        self.created = time.time()
        self.last_access = time.time()

    def touch(self):
        self.last_access = time.time()

    async def close(self):
        try:
            if self.proc and self.proc.returncode is None:
                self.proc.terminate()
                try:
                    await asyncio.wait_for(self.proc.wait(), timeout=3)
                except asyncio.TimeoutError:
                    self.proc.kill()
        except Exception:
            pass
        try:
            shutil.rmtree(self.work_dir, ignore_errors=True)
        except Exception:
            pass


SESSIONS: dict[str, HlsSession] = {}


async def start_session(input_url: str) -> HlsSession:
    """Start ffmpeg, transcoding `input_url` (an HTTP URL with _sid for
    Synology) to HLS in a fresh temp directory."""
    session_id = uuid.uuid4().hex
    work = Path(gettempdir()) / f"synocloud_hls_{session_id}"
    work.mkdir(parents=True, exist_ok=True)
    playlist = work / "playlist.m3u8"

    args = [
        "ffmpeg",
        "-loglevel", "error",
        "-fflags", "+genpts",
        "-y",
        # Be tolerant of self-signed TLS on Synology relays
        "-tls_verify", "0",
        "-user_agent", "SynoCloud/1.0",
        "-i", input_url,
        # Video: copy if already H.264, else transcode to H.264
        "-map", "0:v:0?",
        "-map", "0:a:0?",
        "-c:v", "copy",
        # Audio: always transcode to AAC for browser compat
        "-c:a", "aac",
        "-b:a", "192k",
        "-ac", "2",
        # HLS muxer parameters
        "-hls_time", "4",
        "-hls_list_size", "0",
        "-hls_segment_type", "mpegts",
        "-hls_flags", "independent_segments+temp_file",
        "-hls_segment_filename", str(work / "seg_%05d.ts"),
        "-f", "hls",
        str(playlist),
    ]

    proc = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
    )

    sess = HlsSession(work, proc)
    SESSIONS[session_id] = sess
    return sess


async def wait_for_playlist(sess: HlsSession, timeout_s: float = 25.0) -> Optional[Path]:
    """Wait until ffmpeg has written at least one segment + playlist."""
    pl = sess.work_dir / "playlist.m3u8"
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if pl.exists() and any(sess.work_dir.glob("seg_*.ts")):
            return pl
        if sess.proc.returncode is not None:
            return None
        await asyncio.sleep(0.3)
    return None


async def gc_loop():
    while True:
        try:
            now = time.time()
            stale = [sid for sid, s in SESSIONS.items()
                     if now - s.last_access > SESSION_TTL_SECONDS]
            for sid in stale:
                sess = SESSIONS.pop(sid, None)
                if sess:
                    await sess.close()
        except Exception:
            pass
        await asyncio.sleep(60)


async def shutdown_all():
    for sess in list(SESSIONS.values()):
        await sess.close()
    SESSIONS.clear()
