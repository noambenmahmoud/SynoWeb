import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("synocloud_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const tok = () => encodeURIComponent(localStorage.getItem("synocloud_token") || "");

// Real-NAS media URL builders (carry the session token via ?token= since
// <img>/<video> tags can't set Authorization headers).
export function thumbnailUrl(path, size = "medium") {
  if (!path) return "";
  return `${API_BASE}/files/thumbnail?path=${encodeURIComponent(path)}&size=${size}&token=${tok()}`;
}
export function streamUrl(path) {
  if (!path) return "";
  return `${API_BASE}/files/stream?path=${encodeURIComponent(path)}&token=${tok()}`;
}
export function downloadUrl(path) {
  return streamUrl(path);
}

// Resolve "best" preview image for a media item (demo absolute URL → poster → NAS thumb)
export function resolveThumb(item, size = "medium") {
  if (!item) return "";
  if (item.poster) return item.poster;
  if (item.thumbnail) return item.thumbnail; // demo
  if (item.path) return thumbnailUrl(item.path, size);
  return "";
}
export function resolveMediaUrl(item) {
  if (!item) return "";
  if (item.url) return item.url; // demo
  if (item.path) return streamUrl(item.path);
  return "";
}

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
  browse: (path) => api.get("/folders/browse", { params: { path } }).then((r) => r.data),
  storage: () => api.get("/storage/info").then((r) => r.data),
  aiSearch: (query) => api.post("/search/ai", { query }).then((r) => r.data),
  favorites: () => api.get("/favorites").then((r) => r.data),
  addFavorite: (fav) => api.post("/favorites", fav).then((r) => r.data),
  removeFavorite: (id) => api.delete(`/favorites/${encodeURIComponent(id)}`).then((r) => r.data),
};
