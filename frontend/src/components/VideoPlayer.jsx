import { Dialog, DialogContent } from "./ui/dialog";
import { X } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";

export default function VideoPlayer({ video, onClose }) {
  if (!video) return null;
  return (
    <Dialog open={!!video} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl bg-slate-950/95 border-none p-0 overflow-hidden rounded-3xl"
        data-testid="video-player-modal"
      >
        <div className="relative">
          <video
            src={video.url}
            controls
            autoPlay
            className="w-full max-h-[75vh] bg-black"
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
          <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 truncate">
            {video.name}
          </h3>
          <div className="text-sm text-slate-500 mt-1">
            {video.folder} • {formatDate(video.modified)} • {formatBytes(video.size)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
