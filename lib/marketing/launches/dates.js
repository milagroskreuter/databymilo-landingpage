// Fechas como texto "YYYY-MM-DD" (sin hora), interpretadas en hora de Argentina.
// Sirve tanto en el servidor como en el navegador.

export const AR_OFFSET = "-03:00";

function parse(d) {
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

function fmt(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isDate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(parse(d));
}

// Hoy en Argentina.
export function todayAR() {
  return fmt(Date.now() - 3 * 3600 * 1000);
}

export function addDays(d, n) {
  return fmt(parse(d) + n * 86400000);
}

// Días de a hasta b (b - a).
export function diffDays(a, b) {
  return Math.round((parse(b) - parse(a)) / 86400000);
}

export function daysUntil(d, today = todayAR()) {
  return diffDays(today, d);
}

// Inicio del día en Argentina como ISO (para filtrar timestamptz).
export function startOfDayIso(d) {
  return new Date(`${d}T00:00:00${AR_OFFSET}`).toISOString();
}

// Fecha + hora local de Argentina → ISO.
export function atTimeIso(d, time = "10:00") {
  return new Date(`${d}T${time}:00${AR_OFFSET}`).toISOString();
}

// ISO (timestamptz) → fecha de Argentina "YYYY-MM-DD".
export function isoToDateAR(iso) {
  if (!iso) return null;
  return fmt(new Date(iso).getTime() - 3 * 3600 * 1000);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function formatDate(d, { weekday = false, year = false } = {}) {
  if (!d) return "—";
  const ms = parse(d);
  const date = new Date(ms);
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  const withYear = year ? `${base} ${date.getUTCFullYear()}` : base;
  return weekday ? `${WEEKDAYS[date.getUTCDay()]} ${withYear}` : withYear;
}

export function relativeDays(n) {
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  if (n > 0) return `en ${n} días`;
  return `hace ${-n} días`;
}
