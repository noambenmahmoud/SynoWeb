import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import PhotoLightbox from "../components/PhotoLightbox";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export default function Photos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [favIds, setFavIds] = useState(new Set());

  useEffect(() => {
    Promise.all([files.photos(), files.favorites()])
      .then(([p, f]) => {
        setItems(p.items || []);
        setFavIds(new Set((f.items || []).map((x) => x.file_id)));
      })
      .catch(() => toast.error("Impossible de charger les photos"))
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = async (photo) => {
    const id = photo.id;
    if (favIds.has(id)) {
      await files.removeFavorite(id);
      const n = new Set(favIds); n.delete(id); setFavIds(n);
      toast.success("Retiré des favoris");
    } else {
      await files.addFavorite({ file_id: id, name: photo.name, type: "photo", path: photo.folder, thumbnail: photo.thumbnail });
      setFavIds(new Set([...favIds, id]));
      toast.success("Ajouté aux favoris");
    }
  };

  return (
    <Layout title="Photos" subtitle={`${items.length} photo${items.length > 1 ? "s" : ""} dans votre bibliothèque`}>
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              data-testid={`photo-tile-${p.id}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
            >
              <img src={p.thumbnail} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
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
