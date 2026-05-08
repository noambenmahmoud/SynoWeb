import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { files } from "../lib/api";
import PhotoLightbox from "../components/PhotoLightbox";
import VideoPlayer from "../components/VideoPlayer";
import DocumentIcon from "../components/DocumentIcon";
import { Loader2, Sparkles, Image as ImageIcon, Video as VideoIcon, FileText } from "lucide-react";
import { formatBytes, formatDate } from "../lib/format";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [parsed, setParsed] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    files
      .aiSearch(q)
      .then((d) => {
        setParsed(d.parsed);
        setItems(d.items || []);
      })
      .finally(() => setLoading(false));
  }, [q]);

  const photos = items.filter((i) => i.type === "photo");
  const videos = items.filter((i) => i.type === "video");
  const docs = items.filter((i) => i.type === "document");

  return (
    <Layout title={q ? `Recherche : ${q}` : "Recherche IA"} subtitle={parsed?.summary || "Décrivez ce que vous cherchez en langage naturel."}>
      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {parsed && (
            <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 flex flex-wrap gap-3 items-center mb-8" data-testid="ai-parsed-banner">
              <div className="inline-flex items-center gap-2 text-amber-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" /> Interprétation IA
              </div>
              {parsed.types?.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-xs text-slate-700 border border-amber-100">
                  {t === "photo" && <ImageIcon className="h-3 w-3" />}
                  {t === "video" && <VideoIcon className="h-3 w-3" />}
                  {t === "document" && <FileText className="h-3 w-3" />}
                  {t}
                </span>
              ))}
              {parsed.keywords?.map((k) => (
                <span key={k} className="px-3 py-1 rounded-full bg-white text-xs text-slate-700 border border-amber-100">{k}</span>
              ))}
              {(parsed.date_from || parsed.date_to) && (
                <span className="px-3 py-1 rounded-full bg-white text-xs text-slate-700 border border-amber-100">
                  {parsed.date_from || "…"} → {parsed.date_to || "…"}
                </span>
              )}
            </div>
          )}

          {items.length === 0 && q && (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-16 text-center">
              <div className="font-heading text-xl text-slate-900">Aucun résultat</div>
              <p className="text-sm text-slate-500 mt-2">Essayez une autre formulation, par exemple "vidéos de mariage" ou "factures 2024".</p>
            </div>
          )}

          {photos.length > 0 && (
            <section className="mb-10">
              <h2 className="font-heading text-xl font-medium text-slate-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {photos.map((p) => (
                  <button key={p.id} onClick={() => setActivePhoto(p)} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
                    <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section className="mb-10">
              <h2 className="font-heading text-xl font-medium text-slate-900 mb-4">Vidéos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.map((v) => (
                  <button key={v.id} onClick={() => setActiveVideo(v)} className="text-left rounded-2xl bg-white border border-slate-200/70 overflow-hidden group hover:-translate-y-0.5 transition-all">
                    <div className="aspect-video bg-slate-900 overflow-hidden">
                      <img src={v.thumbnail} alt={v.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <div className="font-medium text-slate-900 truncate">{v.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{v.folder} • {formatDate(v.modified)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {docs.length > 0 && (
            <section>
              <h2 className="font-heading text-xl font-medium text-slate-900 mb-4">Documents</h2>
              <div className="rounded-3xl bg-white border border-slate-200/70 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <DocumentIcon ext={d.ext} className="h-12 w-12" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">{d.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{d.folder} • {formatDate(d.modified)} • {formatBytes(d.size)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      <PhotoLightbox photo={activePhoto} onClose={() => setActivePhoto(null)} />
      <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
    </Layout>
  );
}
