import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { files, resolveThumb, resolveMediaUrl, thumbnailUrl } from "../lib/api";
import PhotoLightbox from "../components/PhotoLightbox";
import { Loader2, Star, Folder, ChevronRight, Home as HomeIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function Breadcrumbs({ path, onNavigate }) {
  const segs = (path || "").split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap mb-6">
      <button
        onClick={() => onNavigate("")}
        data-testid="bc-root"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <HomeIcon className="h-3.5 w-3.5" /> Mes partages
      </button>
      {segs.map((s, i) => {
        const sub = "/" + segs.slice(0, i + 1).join("/");
        const isLast = i === segs.length - 1;
        return (
          <span key={sub} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <button
              onClick={() => onNavigate(sub)}
              disabled={isLast}
              className={`px-2.5 py-1 rounded-lg transition-colors ${isLast ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
            >
              {s}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default function Photos() {
  const [path, setPath] = useState(""); // empty = list of shares
  const [data, setData] = useState({ folders: [], photos: [] });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [favIds, setFavIds] = useState(new Set());
  const [autoEntered, setAutoEntered] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const [browse, fav] = await Promise.all([files.browse(p || ""), files.favorites()]);
      setData({ folders: browse.folders || [], photos: browse.photos || [] });
      setFavIds(new Set((fav.items || []).map((x) => x.file_id)));
      return browse;
    } catch {
      toast.error("Impossible de charger ce dossier");
      setData({ folders: [], photos: [] });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-enter the first "Photos"-like share
  useEffect(() => {
    (async () => {
      const browse = await load(path);
      if (!path && !autoEntered && browse?.folders?.length) {
        const re = /^(photo|photos|images?|pictures?)$/i;
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

  const openPhoto = (p) => {
    setActive({
      ...p,
      _thumb: resolveThumb(p, "medium"),
      _full: p.path ? thumbnailUrl(p.path, "original") : (resolveMediaUrl(p) || resolveThumb(p, "large")),
    });
  };

  const toggleFav = async (photo) => {
    const id = photo.id;
    if (favIds.has(id)) {
      await files.removeFavorite(id);
      const n = new Set(favIds); n.delete(id); setFavIds(n);
      toast.success("Retiré des favoris");
    } else {
      await files.addFavorite({ file_id: id, name: photo.name, type: "photo", path: photo.folder, thumbnail: resolveThumb(photo, "medium") });
      setFavIds(new Set([...favIds, id]));
      toast.success("Ajouté aux favoris");
    }
  };

  const subtitle = path
    ? `${data.folders.length} sous-dossier${data.folders.length > 1 ? "s" : ""} • ${data.photos.length} photo${data.photos.length > 1 ? "s" : ""}`
    : "Choisissez un dossier pour explorer vos photos";

  return (
    <Layout title="Photos" subtitle={subtitle}>
      <Breadcrumbs path={path} onNavigate={setPath} />

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {data.folders.length > 0 && (
            <section className="mb-10">
              {data.photos.length > 0 && (
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Dossiers</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.folders.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setPath(f.path)}
                    data-testid={`folder-${f.name}`}
                    className="text-left rounded-2xl bg-white border border-slate-200/70 p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-25px_rgba(15,23,42,0.18)] transition-all"
                  >
                    <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
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

          {data.photos.length > 0 && (
            <section>
              {data.folders.length > 0 && (
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Photos</h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {data.photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openPhoto(p)}
                    data-testid={`photo-tile-${p.id}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                  >
                    <img src={resolveThumb(p, "medium")} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-white text-xs font-medium truncate text-left">{p.name}</div>
                    </div>
                    {favIds.has(p.id) && (
                      <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.folders.length === 0 && data.photos.length === 0 && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <ImageIcon className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 mt-4">Dossier vide</h3>
              <p className="text-sm text-slate-500 mt-2">Aucune photo ou sous-dossier ici. Remontez dans l'arborescence avec le fil d'Ariane ci-dessus.</p>
            </div>
          )}
        </>
      )}

      <PhotoLightbox
        photo={active}
        onClose={() => setActive(null)}
        onFavorite={toggleFav}
        isFavorite={active ? favIds.has(active.id) : false}
      />
    </Layout>
  );
}
