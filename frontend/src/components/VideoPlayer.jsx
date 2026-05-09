import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { X, Download, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, formatDate } from "../lib/format";
import { Button } from "./ui/button";
import Hls from "hls.js";
import { files as filesApi, hlsPlaylistUrl } from "../lib/api";
import { toast } from "sonner";

export default function VideoPlayer({ video, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const sessionRef = useRef(null);
  const [mode, setMode] = useState("direct"); // 'direct' | 'hls'
  const [hlsLoading, setHlsLoading] = useState(false);

  useEffect(() => {
    if (!video) return;
    setMode("direct");
    setHlsLoading(false);
  }, [video]);

  // Cleanup HLS session on close
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (sessionRef.current) {
        filesApi.hlsStop(sessionRef.current).catch(() => {});
        sessionRef.current = null;
      }
    };
  }, []);

  const startHls = async () => {
    if (!video?.path || hlsLoading) return;
    setHlsLoading(true);
    try {
      const data = await filesApi.hlsStart(video.path);
      const url = hlsPlaylistUrl(data.playlist_url);
      sessionRef.current = data.session_id;
      const v = videoRef.current;
      if (Hls.isSupported()) {
        if (hlsRef.current) try { hlsRef.current.destroy(); } catch {}
        const hls = new Hls({ lowLatencyMode: false, enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(v);
        hls.on(Hls.Events.ERROR, (_, d) => {
          if (d.fatal) toast.error("Erreur de lecture HLS");
        });
        hlsRef.current = hls;
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = url;
      } else {
        toast.error("HLS non supporté par ce navigateur");
        return;
      }
      setMode("hls");
      toast.success("Mode amélioré activé — son OK");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Transcodage impossible");
    } finally {
      setHlsLoading(false);
    }
  };

  if (!video) return null;
  const directSrc = video._src || video.url || "";
  const poster = video._poster || video.poster || video.thumbnail || "";
  const lower = (video.name || "").toLowerCase();
  const likelyAudioIssue = /\.(mkv|avi|wmv|flv|m2ts|ts|mpg|mpeg)$/.test(lower);

  return (
    <Dialog open={!!video} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl bg-slate-950/95 border-none p-0 overflow-hidden rounded-3xl"
        data-testid="video-player-modal"
      >
        <DialogTitle className="sr-only">{video.name}</DialogTitle>
        <DialogDescription className="sr-only">Lecteur vidéo</DialogDescription>
        <div className="relative">
          <video
            ref={videoRef}
            src={mode === "direct" ? directSrc : undefined}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full max-h-[70vh] bg-black"
            data-testid="video-element"
          />
          <button
            onClick={onClose}
            data-testid="video-close-btn"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="px-8 py-5 bg-white">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 truncate">{video.name}</h3>
              <div className="text-sm text-slate-500 mt-1 truncate">
                {video.folder} • {formatDate(video.modified)} • {formatBytes(video.size)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {mode === "direct" && video.path && (
                <Button
                  onClick={startHls}
                  disabled={hlsLoading}
                  data-testid="video-hls-btn"
                  className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {hlsLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  Mode amélioré
                </Button>
              )}
              <a href={directSrc} target="_blank" rel="noreferrer">
                <Button variant="outline" data-testid="video-open-external-btn" className="rounded-full">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Ouvrir
                </Button>
              </a>
              <a href={directSrc} download={video.name}>
                <Button data-testid="video-download-btn" className="rounded-full bg-slate-900 hover:bg-slate-800">
                  <Download className="h-4 w-4 mr-1.5" /> Télécharger
                </Button>
              </a>
            </div>
          </div>
          {mode === "direct" && likelyAudioIssue && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed flex gap-3" data-testid="audio-codec-warning">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <span className="font-medium">Pas de son ?</span> Les fichiers <span className="font-mono text-xs">.mkv</span>/<span className="font-mono text-xs">.avi</span>/<span className="font-mono text-xs">.ts</span> ont souvent un audio AC3/DTS non lu par le navigateur. Cliquez sur <span className="font-medium">Mode amélioré</span> pour activer le transcodage temps-réel (audio converti en AAC).
              </div>
            </div>
          )}
          {mode === "hls" && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex gap-3">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
              <div>Mode amélioré activé — l'audio est transcodé en AAC à la volée.</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
