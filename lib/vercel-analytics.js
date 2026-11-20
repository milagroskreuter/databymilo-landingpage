// Lectura de Vercel Web Analytics (la usan /stats y el dashboard de inicio).

const PROJECT_ID = "prj_FCuvSA8k1Yw4jXIsAtHuE6FpB5V8";
const TEAM_ID = "team_RbmJFWA5dPjwZTThOy3Mfl8v";
const BASE = "https://api.vercel.com/v1/query/web-analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rango de `days` días que termina `offsetDays` días atrás (0 = hoy). */
export function dateRange(days, offsetDays = 0) {
  const until = new Date(Date.now() - offsetDays * DAY_MS);
  const since = new Date(until.getTime() - days * DAY_MS);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

export async function vaFetch(path, params, token) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("projectId", PROJECT_ID);
  url.searchParams.set("teamId", TEAM_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Vercel Analytics ${res.status}: ${text}`);
  }
  return res.json();
}
