import { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("synocloud_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("synocloud_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    if (data?.requires_otp) {
      // Two-factor: don't persist a session yet, let the caller show OTP UI.
      return data;
    }
    localStorage.setItem("synocloud_token", data.token);
    setUser({ username: data.username, nas_url: data.nas_url, demo: data.demo });
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem("synocloud_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
