// Valores del área Sponsors (los ids se guardan en la base: no renombrar).

export const STAGES = [
  { id: "prospecto", label: "Prospecto", color: "#9a8a90" },
  { id: "contactada", label: "Contactada", color: "#d99a3e" },
  { id: "negociando", label: "Negociando", color: "#7c3aed" },
  { id: "cerrada", label: "Cerrada", color: "#0a66c2" },
  { id: "cobrada", label: "Cobrada", color: "#17663e" },
  { id: "perdida", label: "Perdida", color: "#c0392b" },
];
// Etapas donde ya no hay próximos pasos que perseguir.
export const DONE_STAGES = ["cobrada", "perdida"];
// Etapas con acuerdo cerrado (tienen reporte post-campaña).
export const WON_STAGES = ["cerrada", "cobrada"];

export const INTERACTION_KINDS = [
  { id: "email", label: "Email", icon: "✉" },
  { id: "mensaje", label: "Mensaje / DM", icon: "✦" },
  { id: "llamada", label: "Llamada", icon: "☏" },
  { id: "reunion", label: "Reunión", icon: "◎" },
  { id: "propuesta", label: "Propuesta", icon: "◇" },
  { id: "nota", label: "Nota", icon: "✎" },
];

export const SLOT_CHANNELS = [
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2" },
  { id: "instagram", label: "Instagram", color: "#c13584" },
  { id: "newsletter", label: "Newsletter", color: "#8b1a4a" },
  { id: "blog", label: "Blog", color: "#7c3aed" },
];

export const SLOT_STATUSES = [
  { id: "disponible", label: "Disponible", color: "#9a8a90" },
  { id: "reservado", label: "Reservado", color: "#d99a3e" },
  { id: "confirmado", label: "Confirmado", color: "#0a66c2" },
  { id: "publicado", label: "Publicado", color: "#7c3aed" },
  { id: "cobrado", label: "Cobrado", color: "#17663e" },
  { id: "cancelado", label: "Cancelado", color: "#c0392b" },
];

export const COLLAB_STATUSES = [
  { id: "idea", label: "Idea", color: "#9a8a90" },
  { id: "propuesta", label: "Propuesta", color: "#d99a3e" },
  { id: "aceptada", label: "Aceptada", color: "#0a66c2" },
  { id: "en_curso", label: "En curso", color: "#7c3aed" },
  { id: "publicada", label: "Publicada", color: "#17663e" },
  { id: "descartada", label: "Descartada", color: "#c0392b" },
];

export const CURRENCIES = ["USD", "ARS", "EUR", "BRL", "MXN", "CLP", "COP"];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const STAGE_BY_ID = byId(STAGES);
export const SLOT_CHANNEL_BY_ID = byId(SLOT_CHANNELS);
export const SLOT_STATUS_BY_ID = byId(SLOT_STATUSES);
export const COLLAB_STATUS_BY_ID = byId(COLLAB_STATUSES);
export const INTERACTION_KIND_BY_ID = byId(INTERACTION_KINDS);

/** "USD 1.200" / "ARS 350.000". */
export function formatMoney(amount, currency = "USD") {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  const decimals = Number.isInteger(n) ? 0 : 2;
  return `${currency} ${n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Suma montos agrupando por moneda: "USD 1.200 · ARS 300.000". */
export function sumByCurrency(rows, amountKey = "amount") {
  const totals = {};
  for (const r of rows) {
    const n = Number(r[amountKey]);
    if (!Number.isFinite(n) || r[amountKey] === null) continue;
    const cur = r.currency || "USD";
    totals[cur] = (totals[cur] || 0) + n;
  }
  const parts = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cur, n]) => formatMoney(n, cur));
  return parts.join(" · ");
}

/** Fecha de hoy en Buenos Aires, como YYYY-MM-DD. */
export function todayAR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

/** "12 nov" / "12 nov 2025" si no es este año. */
export function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(String(iso).length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Diferencia en días entre una fecha YYYY-MM-DD y hoy (negativo = vencida). */
export function daysFromToday(iso) {
  if (!iso) return null;
  const a = new Date(`${iso}T12:00:00Z`).getTime();
  const b = new Date(`${todayAR()}T12:00:00Z`).getTime();
  return Math.round((a - b) / 86400000);
}
