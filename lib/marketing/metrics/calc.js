// Cálculos puros sobre métricas (se usan en el servidor y en la pantalla).

/** Interacciones de una publicación: el total de LinkedIn o la suma de likes, comentarios, guardados y compartidos. */
export function interactions(p) {
  if (p.extra?.engagements != null) return p.extra.engagements;
  const parts = [p.likes, p.comments, p.saves, p.shares, p.extra?.reposts, p.extra?.quotes];
  if (parts.every((v) => v == null)) return null;
  return parts.reduce((a, v) => a + (v || 0), 0);
}

/** Cuánta gente la vio: alcance si está, si no vistas o impresiones. */
export function audience(p) {
  return p.reach ?? p.views ?? p.impressions ?? null;
}

/** Tasa de interacción (%) sobre el alcance/vistas. */
export function engagementRate(p) {
  const a = audience(p);
  const i = interactions(p);
  if (!a || i == null) return null;
  return (i / a) * 100;
}

const AR_TZ = "America/Argentina/Buenos_Aires";

/** Día de la semana (0 = lunes) y hora en Argentina. */
export function arWeekdayHour(iso) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: AR_TZ, weekday: "short", hour: "numeric", hour12: false }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value) % 24;
  return { weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd), hour };
}
