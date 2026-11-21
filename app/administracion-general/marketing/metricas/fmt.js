// Formatos y colores compartidos por las pantallas de Métricas.
import { NETWORK_BY_ID } from "@/lib/marketing/constants";

export const DAY_MS = 86400000;

export const nf = (n, d = 0) =>
  n == null || Number.isNaN(n) ? "—" : Number(n).toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 });

export const compact = (n) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  if (a >= 1e4) return `${Math.round(n / 1e3)} k`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1).replace(".", ",")} k`;
  return nf(n);
};

export const signed = (n, d = 0) => (n == null ? "—" : `${n > 0 ? "+" : ""}${nf(n, d)}`);

export const dayLabel = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

export const shortDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" })
    : "—";

export const ago = (iso) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 3600000) return "hace un momento";
  if (ms < DAY_MS) return `hace ${Math.floor(ms / 3600000)} h`;
  const d = Math.floor(ms / DAY_MS);
  return d === 1 ? "ayer" : `hace ${d} días`;
};

// Un color por red, siempre el mismo (el color sigue a la red, no a su posición).
// Validados juntos con el validador de paletas (separación para daltonismo y contraste).
const CHART_COLORS = { instagram: "#c13584", linkedin: "#0a66c2", threads: "#2a9d8f", youtube: "#cc0000" };
export const netColor = (id) => CHART_COLORS[id] || NETWORK_BY_ID[id]?.color || "#7a6a72";

export const MARK_COLOR = "#8b1a4a"; // color de marca para gráficos de una sola serie

export function periodStart(today, days) {
  return new Date(new Date(`${today}T00:00:00Z`).getTime() - days * DAY_MS).toISOString().slice(0, 10);
}
