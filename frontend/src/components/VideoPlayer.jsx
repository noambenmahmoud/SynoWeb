import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { X, Download, ExternalLink, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, formatDate } from "../lib/format";
import { Button } from "./ui/button";

export default function VideoPlayer({ video, onClose }) {
  const videoRef = useRef(null);
  const [audioWarning, setAudioWarning] = useState(false);

  useEffect(() => {
    if (!video) {
      setAudioWarning(false);
      return;
    }
    // Heuristic: detect if file extension suggests a container with potentially incompatible audio
    const lower = (video.name || "").toLowerCase();
    if (/\.(mkv|avi|wmv|flv|m2ts|ts|mpg|mpeg)$/.test(lower)) {
      setAudioWarning(true);
    }
  }, [video]);

  if (!video) return null;
  const src = video._src || video.url || "";
  const poster = video._poster || video.poster || video.thumbnail || "";

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
            src={src}
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
            <div className="flex items-center gap-2 shrink-0">
              <a href={src} target="_blank" rel="noreferrer">
                <Button variant="outline" data-testid="video-open-external-btn" className="rounded-full">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Ouvrir
                </Button>
              </a>
              <a href={src} download={video.name}>
                <Button data-testid="video-download-btn" className="rounded-full bg-slate-900 hover:bg-slate-800">
                  <Download className="h-4 w-4 mr-1.5" /> Télécharger
                </Button>
              </a>
            </div>
          </div>
          {audioWarning && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed flex gap-3" data-testid="audio-codec-warning">
              <Volume2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Pas de son ? Les fichiers <span className="font-mono text-xs">.mkv</span>/<span className="font-mono text-xs">.avi</span>/<span className="font-mono text-xs">.ts</span> contiennent souvent des pistes audio AC3/DTS non supportées par le navigateur. Cliquez sur <span className="font-medium">Télécharger</span> pour lire le fichier dans VLC, ou <span className="font-medium">Ouvrir</span> pour l'ouvrir dans un nouvel onglet.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
