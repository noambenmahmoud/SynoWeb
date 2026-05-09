import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { files, resolveThumb, resolveMediaUrl } from "../lib/api";
import VideoPlayer from "../components/VideoPlayer";
import { Loader2, Play, Film, Folder, ChevronRight, Home as HomeIcon } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";
import { toast } from "sonner";

function Breadcrumbs({ path, onNavigate }) {
  const segs = (path || "").split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap mb-6">
      <button onClick={() => onNavigate("")} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
        <HomeIcon className="h-3.5 w-3.5" /> Mes partages
      </button>
      {segs.map((s, i) => {
        const sub = "/" + segs.slice(0, i + 1).join("/");
        const isLast = i === segs.length - 1;
        return (
          <span key={sub} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <button onClick={() => onNavigate(sub)} disabled={isLast} className={`px-2.5 py-1 rounded-lg transition-colors ${isLast ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>{s}</button>
          </span>
        );
      })}
    </nav>
  );
}

export default function Videos() {
  const [path, setPath] = useState("");
  const [data, setData] = useState({ folders: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [autoEntered, setAutoEntered] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const browse = await files.browse(p || "");
      setData({ folders: browse.folders || [], videos: browse.videos || [] });
      return browse;
    } catch {
      toast.error("Impossible de charger ce dossier");
      setData({ folders: [], videos: [] });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const browse = await load(path);
      if (!path && !autoEntered && browse?.folders?.length) {
        const re = /^(video|videos|movies?|films?|cinema|series?)$/i;
        const match = browse.folders.find((f) => re.test(f.name));
        if (match) {
          setAutoEntered(true);
          setPath(match.path);
        } else {
          setAutoEntered(true);
        }
      }
    })();
  }, [path, load, autoEntered]);

  const openVideo = (v) => setActive({ ...v, _src: resolveMediaUrl(v), _poster: resolveThumb(v) });

  const subtitle = path
    ? `${data.folders.length} sous-dossier${data.folders.length > 1 ? "s" : ""} • ${data.videos.length} vidéo${data.videos.length > 1 ? "s" : ""}`
    : "Choisissez un dossier pour explorer vos vidéos";

  return (
    <Layout title="Vidéos" subtitle={subtitle}>
      <Breadcrumbs path={path} onNavigate={setPath} />

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {data.folders.length > 0 && (
            <section className="mb-10">
              {data.videos.length > 0 && (
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Dossiers</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.folders.map((f) => (
                  <button key={f.path} onClick={() => setPath(f.path)} className="text-left rounded-2xl bg-white border border-slate-200/70 p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-25px_rgba(15,23,42,0.18)] transition-all">
                    <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                      <Folder className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate">{f.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{f.path}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.videos.length > 0 && (
            <section>
              {data.folders.length > 0 && (
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Vidéos</h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {data.videos.map((v) => {
                  const cover = resolveThumb(v);
                  return (
                    <button key={v.id} onClick={() => openVideo(v)} data-testid={`video-tile-${v.id}`} className="text-left rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-all">
                      <div className="aspect-[2/3] bg-slate-900 relative overflow-hidden rounded-2xl">
                        {cover ? (
                          <img src={cover} alt={v.name} loading="lazy" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                            <Film className="h-10 w-10 text-slate-500" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <div className="h-14 w-14 rounded-full bg-white/95 backdrop-blur flex items-center justify-center">
                            <Play className="h-5 w-5 text-slate-900 ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        {v.poster && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-400/90 text-slate-900">TMDB</div>
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
            </section>
          )}

          {data.folders.length === 0 && data.videos.length === 0 && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Film className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 mt-4">Dossier vide</h3>
              <p className="text-sm text-slate-500 mt-2">Aucune vidéo ou sous-dossier ici.</p>
            </div>
          )}
        </>
      )}

      <VideoPlayer video={active} onClose={() => setActive(null)} />
    </Layout>
  );
}
