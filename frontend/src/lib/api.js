import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 30000,
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
      // Session expired
      setAuthToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    // Provide a friendlier default message
    err.friendlyMessage = typeof detail === "string" ? detail : (detail?.msg || err.message || "Something went wrong.");
    return Promise.reject(err);
  }
);

export function showError(err, fallback = "Something went wrong.") {
  const msg = err?.friendlyMessage || err?.response?.data?.detail || err?.message || fallback;
  toast.error(typeof msg === "string" ? msg : fallback);
}

export function showSuccess(msg) {
  toast.success(msg);
}
