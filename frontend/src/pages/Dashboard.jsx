import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import { formatBytes, formatDate } from "../lib/format";
import { Image, Video, FileText, HardDrive, ArrowRight, Sparkles } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/70 p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)] transition-all">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-1 font-heading text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    Promise.all([files.photos(), files.videos(), files.documents(), files.storage()])
      .then(([p, v, d, s]) => {
        setPhotos(p.items || []);
        setVideos(v.items || []);
        setDocs(d.items || []);
        setStorage(s);
      })
      .catch(() => {});
  }, []);

  const usedPct = storage ? Math.round((storage.used_bytes / storage.total_bytes) * 100) : 0;

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
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-heading text-5xl font-semibold tracking-tight">{storage ? formatBytes(storage.used_bytes) : "—"}</span>
              <span className="text-slate-400">/ {storage ? formatBytes(storage.total_bytes) : "—"}</span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: `${usedPct}%` }} />
            </div>
            <div className="mt-2 text-sm text-slate-400">{usedPct}% utilisé</div>

            {storage?.by_type && (
              <div className="grid grid-cols-4 gap-4 mt-8">
                {Object.entries(storage.by_type).map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/5 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 capitalize">{k === "photos" ? "Photos" : k === "videos" ? "Vidéos" : k === "documents" ? "Documents" : "Autre"}</div>
                    <div className="mt-1 font-heading text-lg font-medium">{formatBytes(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard icon={Image} label="Photos" value={photos.length} sub="dans votre bibliothèque" accent="bg-rose-50 text-rose-500" />
          <StatCard icon={Video} label="Vidéos" value={videos.length} sub="à regarder" accent="bg-violet-50 text-violet-500" />
          <StatCard icon={FileText} label="Documents" value={docs.length} sub="indexés" accent="bg-emerald-50 text-emerald-600" />
          <Link to="/search?q=photos%20de%20l%27%C3%A9t%C3%A9" className="rounded-3xl bg-amber-50 border border-amber-100 p-6 hover:-translate-y-0.5 transition-all group" data-testid="suggest-search-card">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-amber-600">Recherche IA</div>
            <div className="mt-1 font-heading text-lg font-medium tracking-tight text-slate-900">Essayez "photos de l'été"</div>
            <div className="mt-2 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
              Lancer <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Recent photos */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Récents</div>
            <h2 className="font-heading text-2xl font-medium tracking-tight text-slate-900 mt-1">Photos récentes</h2>
          </div>
          <Link to="/photos" data-testid="see-all-photos" className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1">
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {photos.slice(0, 6).map((p) => (
            <Link key={p.id} to="/photos" className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
              <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent docs */}
      <section className="mt-12 mb-4">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-heading text-2xl font-medium tracking-tight text-slate-900">Documents récents</h2>
          <Link to="/documents" className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1">
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.slice(0, 4).map((d) => (
            <div key={d.id} className="rounded-2xl bg-white border border-slate-200/70 p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-semibold uppercase text-slate-600">
                {d.ext}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900 truncate">{d.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{d.folder} • {formatDate(d.modified)} • {formatBytes(d.size)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
