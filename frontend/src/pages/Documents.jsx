import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import DocumentIcon from "../components/DocumentIcon";
import { Loader2, Folder, ChevronRight, Home as HomeIcon, FileText } from "lucide-react";
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

export default function Documents() {
  const [path, setPath] = useState("");
  const [data, setData] = useState({ folders: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [autoEntered, setAutoEntered] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const browse = await files.browse(p || "");
      setData({ folders: browse.folders || [], documents: browse.documents || [] });
      return browse;
    } catch {
      toast.error("Impossible de charger ce dossier");
      setData({ folders: [], documents: [] });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const browse = await load(path);
      if (!path && !autoEntered && browse?.folders?.length) {
        const re = /^(doc|docs|documents?|fichiers?|files?)$/i;
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

  const subtitle = path
    ? `${data.folders.length} sous-dossier${data.folders.length > 1 ? "s" : ""} • ${data.documents.length} document${data.documents.length > 1 ? "s" : ""}`
    : "Choisissez un dossier pour explorer vos documents";

  return (
    <Layout title="Documents" subtitle={subtitle}>
      <Breadcrumbs path={path} onNavigate={setPath} />

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {data.folders.length > 0 && (
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.folders.map((f) => (
                  <button key={f.path} onClick={() => setPath(f.path)} className="text-left rounded-2xl bg-white border border-slate-200/70 p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-25px_rgba(15,23,42,0.18)] transition-all">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
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

          {data.documents.length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-200/70 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {data.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group" data-testid={`doc-row-${d.id}`}>
                    <DocumentIcon ext={d.ext} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate">{d.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{d.folder} • {formatDate(d.modified)} • {formatBytes(d.size)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.folders.length === 0 && data.documents.length === 0 && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="font-heading text-xl font-medium tracking-tight text-slate-900 mt-4">Dossier vide</h3>
              <p className="text-sm text-slate-500 mt-2">Aucun document ou sous-dossier ici.</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
