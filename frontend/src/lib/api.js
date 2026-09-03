import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://inventario-tic-edemsa.onrender.com";
export const API = process.env.REACT_APP_API_URL || `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 60000,
});

let _token = null;

export function setAuthToken(token) {
  _token = token;
  if (token) {
    localStorage.setItem("it-inv-token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("it-inv-token");
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getStoredToken() {
  if (_token) return _token;
  const t = localStorage.getItem("it-inv-token");
  if (t) {
    _token = t;
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  }
  return t;
}

// Boot: attach any stored token
getStoredToken();

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail;
    if (status === 401) {
      // Sesión expirada
      setAuthToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    // Mensaje amigable por defecto
    err.friendlyMessage = typeof detail === "string"
      ? detail
      : (detail?.msg || err.message || "Ocurrió un problema inesperado.");
    return Promise.reject(err);
  }
);

export function showError(err, fallback = "Ocurrió un problema inesperado.") {
  const msg = err?.friendlyMessage || err?.response?.data?.detail || err?.message || fallback;
  toast.error(typeof msg === "string" ? msg : fallback);
}

export function showSuccess(msg) {
  toast.success(msg);
}
