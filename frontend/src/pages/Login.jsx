import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Cloud, ServerCog, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [demo, setDemo] = useState(true);
  const [form, setForm] = useState({ nas_url: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e, asDemo) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ ...form, demo: asDemo ?? demo });
      toast.success("Connecté");
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Échec de la connexion";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden flex items-center justify-center p-6">
      {/* Background ornaments */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[460px] w-[460px] rounded-full bg-slate-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-10 items-stretch">
        {/* Left brand panel */}
        <div className="hidden md:flex flex-col justify-between rounded-3xl bg-slate-900 text-white p-10 overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm tracking-[0.25em] uppercase text-slate-400">
              <Cloud className="h-4 w-4" /> Synology Cloud
            </div>
            <h1 className="font-heading text-5xl font-semibold mt-10 leading-tight tracking-tight">
              Vos souvenirs.<br />Vos documents.<br />
              <span className="text-amber-200">À portée de main.</span>
            </h1>
            <p className="mt-6 text-slate-300 leading-relaxed max-w-sm">
              Une interface élégante pour parcourir, lire et organiser tout ce qui vit sur votre NAS Synology — avec une recherche pilotée par l'IA.
            </p>
          </div>
          <div className="relative flex items-center gap-3 text-slate-400 text-sm">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Recherche en langage naturel — "photos de l'été 2024"
          </div>
        </div>

        {/* Right form */}
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.18)] p-8 md:p-10">
          <div className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-slate-400">
            <ServerCog className="h-4 w-4" /> Connexion
          </div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 mt-4">
            Connectez votre NAS
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Saisissez l'adresse de votre Synology et vos identifiants DSM, ou explorez d'abord en mode démo.
          </p>

          <div className="mt-6 inline-flex p-1 rounded-full bg-slate-100" data-testid="login-mode-toggle">
            <button
              type="button"
              onClick={() => setDemo(true)}
              data-testid="mode-demo-btn"
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${demo ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Mode démo
            </button>
            <button
              type="button"
              onClick={() => setDemo(false)}
              data-testid="mode-nas-btn"
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${!demo ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Mon NAS Synology
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {!demo && (
              <>
                <div>
                  <Label htmlFor="nas_url" className="text-slate-700">URL du NAS</Label>
                  <Input
                    id="nas_url"
                    data-testid="nas-url-input"
                    placeholder="https://mon-nas.synology.me:5001"
                    value={form.nas_url}
                    onChange={(e) => setForm({ ...form, nas_url: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="username" className="text-slate-700">Identifiant DSM</Label>
                  <Input
                    id="username"
                    data-testid="username-input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-700">Mot de passe</Label>
                  <Input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
              </>
            )}

            {demo && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 text-sm text-slate-600 leading-relaxed">
                Le <span className="font-medium text-slate-900">mode démo</span> charge un jeu de photos, vidéos et documents de démonstration, idéal pour découvrir l'interface avant de connecter votre NAS.
              </div>
            )}

            <Button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : demo ? "Démarrer la démo" : "Se connecter"}
            </Button>
          </form>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            Les identifiants ne sont jamais persistés en base — ils servent uniquement à ouvrir une session DSM côté serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
