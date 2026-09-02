// Locale, format helpers, and dictionaries for translating backend enum strings
// into professional Latin American / Colombian Spanish for the UI.
// Kept centralized so no backend enum keys (English) need to be changed.

export const LOCALE = "es-CO";

// --- Movement type labels (stored as 'entry'|'exit'|'adjustment' in DB)
export const MOVEMENT_TYPES = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};

// --- Product status labels (computed by backend as 'available'|'low'|'out'|'inactive'|'discontinued')
export const STATUS_LABELS = {
  available: "Disponible",
  low: "Stock bajo",
  out: "Agotado",
  discontinued: "Descontinuado",
  inactive: "Inactivo",
  info: "Informativo",
  warn: "Advertencia",
  error: "Crítico",
};

// --- Alert kinds ('low_stock'|'out_of_stock'|'missing_code'|'no_movement')
export const ALERT_KINDS = {
  low_stock: "Stock bajo",
  out_of_stock: "Agotado",
  missing_code: "Sin código",
  no_movement: "Sin movimiento",
};

// --- Count session status ('open'|'closed')
export const COUNT_STATUS = {
  open: "Abierta",
  closed: "Cerrada",
};

// --- Role labels
export const ROLE_LABELS = {
  admin: "Administrador",
  manager: "Gestor",
  viewer: "Consulta",
};

// --- Helpers
export function tMovementType(t) {
  return MOVEMENT_TYPES[t] || t || "";
}
export function tStatus(s) {
  return STATUS_LABELS[s] || s || "";
}
export function tAlertKind(k) {
  return ALERT_KINDS[k] || (k || "").replace(/_/g, " ");
}
export function tCountStatus(s) {
  return COUNT_STATUS[s] || s || "";
}
export function tRole(r) {
  return ROLE_LABELS[r] || r || "";
}

// Best-effort: translate a stored reason string (English default) to Spanish.
const REASON_MAP = {
  "purchase": "Compra",
  "return": "Devolución",
  "transfer in": "Traslado entrante",
  "correction": "Corrección",
  "initial stock": "Stock inicial",
  "initial stock (demo)": "Stock inicial (demo)",
  "employee request": "Solicitud de empleado",
  "employee request (demo)": "Solicitud de empleado (demo)",
  "consumption": "Consumo",
  "transfer out": "Traslado saliente",
  "replacement": "Reemplazo",
  "replacement (demo)": "Reemplazo (demo)",
  "return to supplier": "Devolución al proveedor",
  "other": "Otro",
  "physical count discrepancy": "Discrepancia de inventario físico",
  "damaged": "Dañado",
  "lost": "Perdido",
  "found": "Encontrado",
  "administrative correction": "Corrección administrativa",
  "office rollout (demo)": "Entrega a oficina (demo)",
  "restock (demo)": "Reabastecimiento (demo)",
  "purchase order (demo)": "Orden de compra (demo)",
  "bulk import": "Importación masiva",
};
export function tReason(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase();
  return REASON_MAP[key] || raw;
}

// --- Date / number / currency formatters (Colombia)
export function formatDate(value, opts = {}) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", ...opts });
  } catch { return String(value); }
}

export function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(LOCALE, {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(value); }
}

export function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
  } catch { return String(value); }
}

export function formatNumber(value, opts = {}) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2, ...opts }).format(n);
}

export function formatCurrency(value, currency = "COP") {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}
