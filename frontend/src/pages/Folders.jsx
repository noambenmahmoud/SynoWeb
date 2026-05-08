import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import { Folder, Loader2 } from "lucide-react";

export default function Folders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    files.folders().then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Dossiers" subtitle="Naviguez dans l'arborescence de votre NAS.">
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((f) => (
            <div key={f.path} className="rounded-3xl bg-white border border-slate-200/70 p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)] transition-all" data-testid={`folder-card-${f.name}`}>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Folder className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="mt-4 font-heading text-lg font-medium tracking-tight text-slate-900">{f.name}</div>
              <div className="text-sm text-slate-500 mt-1 truncate">{f.path}</div>
              {f.count > 0 && (
                <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">{f.count} élément{f.count > 1 ? "s" : ""}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
