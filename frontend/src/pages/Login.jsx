import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Cloud, ServerCog, Sparkles, Loader2, KeyRound } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [demo, setDemo] = useState(true);
  const [form, setForm] = useState({ nas_url: "", username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const otpInputRef = useRef(null);

  const submit = async (e, asDemo) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetail("");
    try {
      const data = await login({
        ...form,
        otp_code: otpRequired ? otp : "",
        demo: asDemo ?? demo,
      });
      if (data?.requires_otp) {
        setOtpRequired(true);
        toast.info("Code à 6 chiffres requis");
        // Focus OTP field on next tick
        setTimeout(() => otpInputRef.current?.focus(), 50);
        return;
      }
      toast.success("Connecté");
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Échec de la connexion";
      setErrorDetail(msg);
      toast.error("Échec de la connexion");
      // If OTP was wrong, keep the OTP field but clear it
      if (otpRequired) setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const cancelOtp = () => {
    setOtpRequired(false);
    setOtp("");
    setErrorDetail("");
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
            {!demo && !otpRequired && (
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

            {!demo && otpRequired && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 text-amber-700 font-medium">
                    <KeyRound className="h-4 w-4" />
                    Vérification en 2 étapes
                  </div>
                  <p className="text-sm text-amber-800/90 mt-1.5 leading-relaxed">
                    Ouvrez l'app <span className="font-medium">Synology Secure SignIn</span> sur votre téléphone et saisissez le code à 6 chiffres ci-dessous.
                  </p>
                </div>
                <div>
                  <Label htmlFor="otp" className="text-slate-700">Code à 6 chiffres</Label>
                  <Input
                    id="otp"
                    ref={otpInputRef}
                    data-testid="otp-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1.5 h-12 text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={cancelOtp}
                  data-testid="otp-cancel-btn"
                  className="text-sm text-slate-500 hover:text-slate-900 underline-offset-4 hover:underline"
                >
                  ← Modifier les identifiants
                </button>
              </div>
            )}

            {demo && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 text-sm text-slate-600 leading-relaxed">
                Le <span className="font-medium text-slate-900">mode démo</span> charge un jeu de photos, vidéos et documents de démonstration, idéal pour découvrir l'interface avant de connecter votre NAS.
              </div>
            )}

            <Button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading || (otpRequired && otp.length !== 6)}
              className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : demo ? (
                "Démarrer la démo"
              ) : otpRequired ? (
                "Vérifier le code"
              ) : (
                "Se connecter"
              )}
            </Button>

            {errorDetail && (
              <div data-testid="login-error" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 leading-relaxed whitespace-pre-line">
                {errorDetail}
              </div>
            )}
          </form>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            Les identifiants ne sont jamais persistés en base — ils servent uniquement à ouvrir une session DSM côté serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
