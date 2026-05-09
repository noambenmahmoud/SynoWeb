import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { X, Download, ExternalLink, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, formatDate } from "../lib/format";
import { Button } from "./ui/button";

export default function VideoPlayer({ video, onClose }) {
  const videoRef = useRef(null);
  const [audioMissing, setAudioMissing] = useState(false);

  useEffect(() => {
    if (!video) {
      setAudioMissing(false);
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    let cancelled = false;
    const checkAudio = () => {
      if (cancelled) return;
      // Heuristic: after a short play, if audioTracks is empty OR muted unintentionally
      // there's likely an unsupported audio codec. The browser still plays video.
      const hasAudio = (el.audioTracks && el.audioTracks.length > 0)
        || (el.webkitAudioDecodedByteCount && el.webkitAudioDecodedByteCount > 0);
      if (!hasAudio && el.currentTime > 0.3) setAudioMissing(true);
    };
    const id = setInterval(checkAudio, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [video]);

  if (!video) return null;
  const src = video._src || video.url || "";
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
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
          {(audioMissing || likelyAudioIssue) && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed flex gap-3" data-testid="audio-codec-warning">
              <Volume2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Audio absent ?</span> Ce fichier utilise probablement une piste audio AC3/DTS/EAC3 non décodable nativement par votre navigateur (Chrome/Firefox). La vidéo s'affiche, mais le son est ignoré. <span className="font-medium">Téléchargez le fichier</span> pour le lire dans VLC, ou ouvrez-le dans un onglet (Safari/Edge gèrent parfois mieux ces codecs).
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
