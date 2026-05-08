import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import { Loader2, Star } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";
import DocumentIcon from "../components/DocumentIcon";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    files.favorites().then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Favoris" subtitle="Vos fichiers préférés, à portée de main.">
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/70 p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 mt-4">Aucun favori pour l'instant</h3>
          <p className="text-sm text-slate-500 mt-2">Ouvrez une photo et appuyez sur l'étoile pour l'ajouter ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((f) => (
            <div key={f.file_id} className="rounded-2xl bg-white border border-slate-200/70 overflow-hidden group hover:-translate-y-0.5 transition-all">
              {f.type === "photo" && f.thumbnail ? (
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  <img src={f.thumbnail} alt={f.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-square bg-slate-50 flex items-center justify-center">
                  <DocumentIcon ext={f.name?.split(".").pop()} className="h-14 w-14" />
                </div>
              )}
              <div className="p-3">
                <div className="text-sm font-medium text-slate-900 truncate">{f.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{f.path}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
