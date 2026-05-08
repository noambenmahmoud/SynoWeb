import { Navigate, BrowserRouter, Route, Routes } from "react-router-dom";
import "@/App.css";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Photos from "./pages/Photos";
import Videos from "./pages/Videos";
import Documents from "./pages/Documents";
import Favorites from "./pages/Favorites";
import Folders from "./pages/Folders";
import Search from "./pages/Search";
import { Loader2 } from "lucide-react";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/photos" element={<Protected><Photos /></Protected>} />
          <Route path="/videos" element={<Protected><Videos /></Protected>} />
          <Route path="/documents" element={<Protected><Documents /></Protected>} />
          <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
          <Route path="/folders" element={<Protected><Folders /></Protected>} />
          <Route path="/search" element={<Protected><Search /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
