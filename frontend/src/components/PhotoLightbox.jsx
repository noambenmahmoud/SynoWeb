import { Dialog, DialogContent } from "./ui/dialog";
import { Download, X, Star } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";
import { Button } from "./ui/button";

export default function PhotoLightbox({ photo, onClose, onFavorite, isFavorite }) {
  if (!photo) return null;
  return (
    <Dialog open={!!photo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-6xl bg-slate-950/95 border-none p-0 overflow-hidden rounded-3xl"
        data-testid="photo-lightbox"
      >
        <div className="relative">
          <img
            src={photo.url}
            alt={photo.name}
            className="w-full max-h-[80vh] object-contain bg-black"
          />
          <button
            onClick={onClose}
            data-testid="lightbox-close-btn"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="px-8 py-6 bg-white">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 truncate">
                {photo.name}
              </h3>
              <div className="text-sm text-slate-500 mt-1">
                {photo.folder} • {formatDate(photo.modified)} • {formatBytes(photo.size)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => onFavorite?.(photo)}
                data-testid="lightbox-favorite-btn"
                className="rounded-full"
              >
                <Star className={`h-4 w-4 mr-1.5 ${isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                {isFavorite ? "Favori" : "Ajouter aux favoris"}
              </Button>
              <a href={photo.url} target="_blank" rel="noreferrer" download>
                <Button data-testid="lightbox-download-btn" className="rounded-full bg-slate-900 hover:bg-slate-800">
                  <Download className="h-4 w-4 mr-1.5" /> Télécharger
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
