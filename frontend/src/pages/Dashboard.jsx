import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import { formatBytes } from "../lib/format";
import { Image, Video, FileText, HardDrive, ArrowRight, Sparkles, Folder as FolderIcon } from "lucide-react";

function StatCard() { return null; } // eslint-disable-line no-unused-vars

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    Promise.all([files.folders(), files.storage()])
      .then(([f, s]) => {
        setFolders(f.items || []);
        setStorage(s);
      })
      .catch(() => {});
  }, []);

  const total = storage?.total_bytes || 0;
  const used = storage?.used_bytes || 0;
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
  const volumes = storage?.volumes || [];

  return (
    <Layout title="Bonjour 👋" subtitle="Voici un aperçu de votre espace personnel.">
      {/* Hero / storage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 text-white p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
              <HardDrive className="h-4 w-4" /> Stockage
            </div>
            <div className="mt-6 flex items-baseline gap-3 flex-wrap">
              <span className="font-heading text-5xl font-semibold tracking-tight">{total ? formatBytes(used) : "—"}</span>
              <span className="text-slate-400">/ {total ? formatBytes(total) : "—"}</span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: `${usedPct}%` }} />
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {total ? `${usedPct}% utilisé` : "Statistiques de stockage indisponibles avec ce compte"}
            </div>

            {volumes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {volumes.slice(0, 6).map((v) => {
                  const vTotal = v.total || 0;
                  const vUsed = v.used || 0;
                  const vPct = vTotal ? Math.round((vUsed / vTotal) * 100) : 0;
                  return (
                    <div key={v.name} className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 truncate">{v.name}</div>
                      <div className="mt-1 font-heading text-lg font-medium">{formatBytes(vUsed)} <span className="text-slate-500 text-sm font-normal">/ {formatBytes(vTotal)}</span></div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-300 rounded-full" style={{ width: `${vPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link to="/photos" data-testid="dashboard-photos-card" className="rounded-3xl bg-white border border-slate-200/70 p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)] transition-all group">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Image className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-400">Photos</div>
            <div className="mt-1 font-heading text-2xl font-medium tracking-tight text-slate-900">Parcourir</div>
            <div className="mt-2 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
              Ouvrir <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
          <Link to="/videos" data-testid="dashboard-videos-card" className="rounded-3xl bg-white border border-slate-200/70 p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)] transition-all group">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
              <Video className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-400">Vidéos</div>
            <div className="mt-1 font-heading text-2xl font-medium tracking-tight text-slate-900">Regarder</div>
            <div className="mt-2 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
              Ouvrir <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
          <Link to="/documents" data-testid="dashboard-documents-card" className="rounded-3xl bg-white border border-slate-200/70 p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)] transition-all group">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-400">Documents</div>
            <div className="mt-1 font-heading text-2xl font-medium tracking-tight text-slate-900">Consulter</div>
            <div className="mt-2 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
              Ouvrir <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
          <Link to="/search?q=photos%20de%20l%27%C3%A9t%C3%A9" className="rounded-3xl bg-amber-50 border border-amber-100 p-6 hover:-translate-y-0.5 transition-all group" data-testid="suggest-search-card">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-amber-600">Recherche IA</div>
            <div className="mt-1 font-heading text-lg font-medium tracking-tight text-slate-900">"photos de l'été"</div>
            <div className="mt-2 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
              Lancer <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Shares quick access */}
      {folders.length > 0 && (
        <section className="mt-12 mb-4">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Vos partages</div>
              <h2 className="font-heading text-2xl font-medium tracking-tight text-slate-900 mt-1">Accès direct</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.slice(0, 9).map((f) => (
              <Link key={f.path} to="/folders" data-testid={`dash-share-${f.name}`} className="rounded-2xl bg-white border border-slate-200/70 p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all group">
                <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <FolderIcon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">{f.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{f.path}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
