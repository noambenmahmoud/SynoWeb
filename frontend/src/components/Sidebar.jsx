import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Image, Video, FileText, Star, Folder, LogOut, Cloud } from "lucide-react";

const NAV = [
  { to: "/", label: "Accueil", icon: Home, end: true, testid: "nav-home" },
  { to: "/photos", label: "Photos", icon: Image, testid: "nav-photos" },
  { to: "/videos", label: "Vidéos", icon: Video, testid: "nav-videos" },
  { to: "/documents", label: "Documents", icon: FileText, testid: "nav-documents" },
  { to: "/favorites", label: "Favoris", icon: Star, testid: "nav-favorites" },
  { to: "/folders", label: "Dossiers", icon: Folder, testid: "nav-folders" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-slate-200/70 bg-white">
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
            <Cloud className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <div className="font-heading text-lg font-semibold tracking-tight text-slate-900 leading-none">
              SynoCloud
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mt-1">Personal NAS</div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end, testid }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testid}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-slate-200/70">
        <div className="rounded-2xl bg-slate-50 p-4 mb-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Connecté en tant que</div>
          <div className="text-sm font-medium text-slate-900 mt-1 truncate" data-testid="sidebar-username">
            {user?.username || "—"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {user?.demo ? "Mode démo" : user?.nas_url}
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
