import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { files, resolveThumb, resolveMediaUrl } from "../lib/api";
import VideoPlayer from "../components/VideoPlayer";
import { Loader2, Play, Film } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";
import { toast } from "sonner";

export default function Videos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    files
      .videos()
      .then((d) => setItems(d.items || []))
      .catch(() => toast.error("Impossible de charger les vidéos"))
      .finally(() => setLoading(false));
  }, []);

  const openVideo = (v) => setActive({ ...v, _src: resolveMediaUrl(v), _poster: resolveThumb(v) });

  return (
    <Layout title="Vidéos" subtitle={`${items.length} vidéo${items.length > 1 ? "s" : ""} prêtes à être lues`}>
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {items.map((v) => {
            const cover = resolveThumb(v);
            return (
              <button
                key={v.id}
                onClick={() => openVideo(v)}
                data-testid={`video-tile-${v.id}`}
                className="text-left rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[2/3] bg-slate-900 relative overflow-hidden rounded-2xl">
                  {cover ? (
                    <img src={cover} alt={v.name} loading="lazy" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                      <Film className="h-10 w-10 text-slate-500" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="h-14 w-14 rounded-full bg-white/95 backdrop-blur flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-5 w-5 text-slate-900 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  {v.poster && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-400/90 text-slate-900">
                      TMDB
                    </div>
                  )}
                </div>
                <div className="px-1 pt-3">
                  <div className="font-medium text-slate-900 truncate text-sm">{v.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{formatDate(v.modified)} • {formatBytes(v.size)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <VideoPlayer video={active} onClose={() => setActive(null)} />
    </Layout>
  );
}
