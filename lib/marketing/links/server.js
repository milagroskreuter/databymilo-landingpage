// Helpers de servidor para la API del admin de Links y embudo.

export const TZ = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Día local (AAAA-MM-DD) de una fecha. */
export function localDay(d) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Período de `days` días hasta hoy; devuelve ISO de inicio y la lista de días. */
export function period(daysParam, { max = 365, def = 30 } = {}) {
  const n = parseInt(daysParam || "", 10);
  const days = Number.isFinite(n) && n > 0 ? Math.min(n, max) : def;
  const now = Date.now();
  const since = new Date(now - days * DAY_MS);
  const list = [];
  for (let i = days - 1; i >= 0; i--) list.push(localDay(now - i * DAY_MS));
  return { days, sinceIso: since.toISOString(), dayList: list, untilIso: new Date(now).toISOString() };
}

/** Trae todas las filas de una consulta paginando de a 1000 (Supabase corta ahí). */
export async function fetchAll(makeQuery, { max = 50000 } = {}) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; from < max; from += PAGE) {
    const { data, error } = await makeQuery().range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
  }
  return rows;
}

export function countBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r) ?? null;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

export function jsonError(err, status = 500) {
  return Response.json({ error: err?.message || String(err) }, { status });
}
