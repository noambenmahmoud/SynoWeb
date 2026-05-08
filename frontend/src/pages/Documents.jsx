import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import DocumentIcon from "../components/DocumentIcon";
import { Loader2, Download, Search } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";
import { toast } from "sonner";
import { Input } from "../components/ui/input";

export default function Documents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    files
      .documents()
      .then((d) => setItems(d.items || []))
      .catch(() => toast.error("Impossible de charger les documents"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.name.toLowerCase().includes(q) || d.folder?.toLowerCase().includes(q));
  }, [filter, items]);

  return (
    <Layout title="Documents" subtitle={`${items.length} fichier${items.length > 1 ? "s" : ""} • PDF, Office, texte`}>
      <div className="mb-6 flex items-center gap-2 max-w-md">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 h-11">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            data-testid="docs-filter-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom ou dossier"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/70 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
            <div className="col-span-6">Nom</div>
            <div className="col-span-3">Dossier</div>
            <div className="col-span-2">Modifié</div>
            <div className="col-span-1 text-right">Taille</div>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <li key={d.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group" data-testid={`doc-row-${d.id}`}>
                <div className="col-span-12 md:col-span-6 flex items-center gap-4 min-w-0">
                  <DocumentIcon ext={d.ext} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{d.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 md:hidden">{d.folder} • {formatDate(d.modified)} • {formatBytes(d.size)}</div>
                  </div>
                </div>
                <div className="hidden md:block col-span-3 text-sm text-slate-500 truncate">{d.folder}</div>
                <div className="hidden md:block col-span-2 text-sm text-slate-500">{formatDate(d.modified)}</div>
                <div className="hidden md:flex col-span-1 justify-end items-center gap-3">
                  <span className="text-sm text-slate-500">{formatBytes(d.size)}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center" data-testid={`doc-download-${d.id}`}>
                    <Download className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-6 py-12 text-center text-sm text-slate-500">Aucun document trouvé.</li>
            )}
          </ul>
        </div>
      )}
    </Layout>
  );
}
