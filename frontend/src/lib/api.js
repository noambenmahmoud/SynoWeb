import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("synocloud_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  login: (data) => api.post("/auth/synology/login", data).then((r) => r.data),
  logout: () => api.post("/auth/synology/logout").then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const files = {
  photos: (folder) => api.get("/photos", { params: { folder } }).then((r) => r.data),
  videos: (folder) => api.get("/videos", { params: { folder } }).then((r) => r.data),
  documents: (folder) => api.get("/documents", { params: { folder } }).then((r) => r.data),
  folders: () => api.get("/folders").then((r) => r.data),
  storage: () => api.get("/storage/info").then((r) => r.data),
  aiSearch: (query) => api.post("/search/ai", { query }).then((r) => r.data),
  favorites: () => api.get("/favorites").then((r) => r.data),
  addFavorite: (fav) => api.post("/favorites", fav).then((r) => r.data),
  removeFavorite: (id) => api.delete(`/favorites/${encodeURIComponent(id)}`).then((r) => r.data),
};
