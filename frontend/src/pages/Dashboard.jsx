import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import { formatBytes } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import {
  Image, Video, FileText, HardDrive, ArrowRight, Sparkles,
  Folder as FolderIcon, Server, ShieldCheck,
} from "lucide-react";

const QUICK_LINKS = [
  { to: "/photos", label: "Photos", desc: "Galerie & lightbox", icon: Image, accent: "bg-rose-50 text-rose-500" },
  { to: "/videos", label: "Vidéos", desc: "Lecteur & affiches", icon: Video, accent: "bg-violet-50 text-violet-500" },
  { to: "/documents", label: "Documents", desc: "PDF, Office, texte", icon: FileText, accent: "bg-emerald-50 text-emerald-600" },
  { to: "/search?q=photos%20de%20l%27%C3%A9t%C3%A9", label: "Recherche IA", desc: "Langage naturel", icon: Sparkles, accent: "bg-amber-50 text-amber-600" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [storage, setStorage] = useState(null);
  const [system, setSystem] = useState(null);

  useEffect(() => {
    Promise.all([files.folders(), files.storage(), files.system()])
      .then(([f, s, sys]) => {
        setFolders(f.items || []);
        setStorage(s);
        setSystem(sys || null);
      })
      .catch(() => {});
  }, []);

  const total = storage?.total_bytes || 0;
  const used = storage?.used_bytes || 0;
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
  const volumes = storage?.volumes || [];
  const hostname = system?.hostname || user?.nas_url?.replace(/^https?:\/\//, "").split(":")[0] || "";

  return (
    <Layout
      title={`Bienvenue${user?.username ? `, ${user.username}` : ""}`}
      subtitle={hostname ? `Connecté à ${hostname}` : "Tableau de bord de votre NAS"}
    >
      {/* Top row: storage (or fallback info) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 text-white p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
              <HardDrive className="h-4 w-4" /> Stockage
            </div>
            {total > 0 ? (
              <>
                <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                  <span className="font-heading text-5xl font-semibold tracking-tight">{formatBytes(used)}</span>
                  <span className="text-slate-400">/ {formatBytes(total)}</span>
                </div>
                <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: `${usedPct}%` }} />
                </div>
                <div className="mt-2 text-sm text-slate-400">{usedPct}% utilisé · {formatBytes(total - used)} libres</div>

                {volumes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    {volumes.slice(0, 6).map((v) => {
                      const vTotal = v.total || 0;
                      const vUsed = v.used || 0;
                      const vPct = vTotal ? Math.round((vUsed / vTotal) * 100) : 0;
                      return (
                        <div key={v.name} className="rounded-2xl bg-white/5 p-4">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 truncate">{v.name}</div>
                          <div className="mt-1 font-heading text-base font-medium leading-tight">{formatBytes(vUsed)}<span className="text-slate-500 font-normal"> / {formatBytes(vTotal)}</span></div>
                          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-amber-300 rounded-full" style={{ width: `${vPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 space-y-3 text-slate-300">
                <div className="font-heading text-3xl font-semibold tracking-tight text-white">Compte standard</div>
                <p className="text-sm leading-relaxed text-slate-400 max-w-md">
                  Les statistiques de stockage détaillées nécessitent un compte administrateur DSM. Vos partages restent accessibles ci-dessous.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connection info card */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/70 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
              <Server className="h-4 w-4" /> NAS Synology
            </div>
            <div className="mt-5 font-heading text-2xl font-semibold tracking-tight text-slate-900 truncate">{hostname || "Mon NAS"}</div>
            <div className="text-sm text-slate-500 mt-1">{system?.version || "DSM"}</div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Utilisateur</div>
                <div className="mt-1 font-medium text-slate-900 truncate">{user?.username || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Partages</div>
                <div className="mt-1 font-medium text-slate-900">{folders.length}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 self-start">
            <ShieldCheck className="h-3.5 w-3.5" /> Connexion chiffrée via QuickConnect
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Accès rapide</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`dash-quick-${l.label}`}
              className="rounded-3xl bg-white border border-slate-200/70 p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-25px_rgba(15,23,42,0.18)] transition-all group"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${l.accent}`}>
                <l.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="mt-5 font-heading text-lg font-medium tracking-tight text-slate-900">{l.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{l.desc}</div>
              <div className="mt-3 inline-flex items-center text-sm text-slate-700 group-hover:gap-2 transition-all">
                Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Shares */}
      {folders.length > 0 && (
        <section className="mt-12 mb-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Vos partages</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((f) => (
              <Link
                key={f.path}
                to={`/folders`}
                data-testid={`dash-share-${f.name}`}
                className="rounded-2xl bg-white border border-slate-200/70 p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all group"
              >
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
