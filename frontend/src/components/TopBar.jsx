import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Loader2 } from "lucide-react";

export default function TopBar({ title, subtitle }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl backdrop-saturate-150 bg-white/75 border-b border-slate-200/70">
      <div className="px-6 lg:px-10 py-5 flex items-center gap-6">
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 truncate" data-testid="page-title">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>

        <form onSubmit={submit} className="flex-1 max-w-xl">
          <div className="group flex items-center gap-2 rounded-full bg-slate-100 px-4 h-11 focus-within:ring-2 focus-within:ring-slate-900/15 transition-all">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <input
              data-testid="ai-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recherche IA — ex : photos de l'été 2024"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-800"
            />
            {loading ? (
              <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </form>
      </div>
    </header>
  );
}
