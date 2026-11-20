// Fechas en hora de Argentina (UTC-3, sin horario de verano).
export const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" del día en Argentina. */
export function arDay(t = Date.now()) {
  const ms = typeof t === "number" ? t : new Date(t).getTime();
  return new Date(ms - AR_OFFSET_MS).toISOString().slice(0, 10);
}

/** Inicio (00:00 AR) de un día "YYYY-MM-DD", en ms UTC. */
export function arDayStart(day) {
  return new Date(`${day}T00:00:00.000Z`).getTime() + AR_OFFSET_MS;
}

export function addDays(day, n) {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** Lunes (AR) de la semana del día dado. */
export function mondayOf(day) {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(day, dow === 0 ? -6 : 1 - dow);
}

/** Primer día del mes ("YYYY-MM-01") de un día. */
export function monthOf(day) {
  return `${day.slice(0, 7)}-01`;
}

export function daysUntil(iso) {
  if (!iso) return null;
  return (new Date(iso).getTime() - Date.now()) / DAY_MS;
}
