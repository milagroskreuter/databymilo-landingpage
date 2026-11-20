// Fechas del calendario editorial, siempre en hora de Argentina (UTC-3, sin
// horario de verano). Son funciones puras: sirven en el server (crons, rutas) y
// en el navegador, así una pieza cae en el mismo día en todos lados aunque la
// compu esté en otra zona horaria.

export const AR_OFFSET = "-03:00";
const OFFSET_MS = 3 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" del día en Argentina para un ISO, Date o timestamp. */
export function arDateKey(value = new Date()) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t - OFFSET_MS).toISOString().slice(0, 10);
}

/** "HH:MM" en Argentina. */
export function arTime(value) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t - OFFSET_MS).toISOString().slice(11, 16);
}

/** ISO (UTC) a partir de un día "YYYY-MM-DD" y una hora "HH:MM" de Argentina. */
export function arToISO(dateKey, time = "10:00") {
  const hhmm = /^\d{2}:\d{2}$/.test(time || "") ? time : "10:00";
  const d = new Date(`${dateKey}T${hhmm}:00${AR_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Inicio del día (00:00 Argentina) como ISO. */
export function arDayStartISO(dateKey) {
  return new Date(`${dateKey}T00:00:00${AR_OFFSET}`).toISOString();
}

/** Suma días a un "YYYY-MM-DD". */
export function addDaysKey(dateKey, days) {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Día de la semana de un "YYYY-MM-DD": 0 domingo … 6 sábado. */
export function weekdayOfKey(dateKey) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

/** Lunes de la semana que contiene ese día. */
export function weekStartKey(dateKey) {
  const wd = weekdayOfKey(dateKey);
  return addDaysKey(dateKey, wd === 0 ? -6 : 1 - wd);
}

/** Días entre dos "YYYY-MM-DD" (b - a). */
export function diffDaysKey(a, b) {
  return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / DAY_MS);
}

export function monthKey(dateKey) {
  return dateKey.slice(0, 7);
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "lun 24/11" */
export function shortDayLabel(dateKey) {
  const [, m, d] = dateKey.split("-");
  return `${WEEKDAYS_SHORT[weekdayOfKey(dateKey)]} ${Number(d)}/${Number(m)}`;
}

/** "lun 24/11 · 10:00" para un ISO. */
export function whenLabel(iso) {
  if (!iso) return "Sin fecha";
  return `${shortDayLabel(arDateKey(iso))} · ${arTime(iso)}`;
}

export { pad };
