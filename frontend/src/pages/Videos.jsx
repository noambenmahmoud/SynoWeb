import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import VideoPlayer from "../components/VideoPlayer";
import { Loader2, Play } from "lucide-react";
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

  return (
    <Layout title="Vidéos" subtitle={`${items.length} vidéo${items.length > 1 ? "s" : ""} prêtes à être lues`}>
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v)}
              data-testid={`video-tile-${v.id}`}
              className="text-left rounded-2xl bg-white border border-slate-200/70 overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.2)] transition-all"
            >
              <div className="aspect-video bg-slate-900 relative overflow-hidden">
                <img src={v.thumbnail} alt={v.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-white/90 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 text-slate-900 ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="font-medium text-slate-900 truncate">{v.name}</div>
                <div className="text-xs text-slate-500 mt-1">{v.folder} • {formatDate(v.modified)} • {formatBytes(v.size)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <VideoPlayer video={active} onClose={() => setActive(null)} />
    </Layout>
  );
}
