// Cálculos del Espía de competencia: cada publicación se compara contra el promedio
// (mediana) de su propia cuenta, así una cuenta chica no queda tapada por una grande.
import { arWeekdayHour } from "@/lib/marketing/metrics/calc";

export const DAY_MS = 86400000;
export const FRESH_DAYS = 2; // los posteos más nuevos todavía están juntando likes

export const interactionsOf = (p) =>
  p.likes == null && p.comments == null ? null : (p.likes || 0) + (p.comments || 0);

export function median(nums) {
  const v = nums.filter((n) => n != null && Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export const firstLine = (caption) =>
  (caption || "").split("\n").map((s) => s.trim()).find(Boolean) || "";

export const captionWords = (caption) => (caption || "").trim().split(/\s+/).filter(Boolean).length;

export const LENGTHS = [
  { id: "corto", label: "Corto (hasta 30 palabras)", max: 30 },
  { id: "medio", label: "Medio (31 a 120 palabras)", max: 120 },
  { id: "largo", label: "Largo (más de 120 palabras)", max: Infinity },
];
export const lengthOf = (caption) => LENGTHS.find((l) => captionWords(caption) <= l.max).id;

export const SLOTS = [
  { id: 0, label: "Madrugada (0 a 6 h)", from: 0, to: 6 },
  { id: 1, label: "Mañana (6 a 12 h)", from: 6, to: 12 },
  { id: 2, label: "Tarde (12 a 18 h)", from: 12, to: 18 },
  { id: 3, label: "Noche (18 a 24 h)", from: 18, to: 24 },
];
export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Agrega a cada publicación: interacciones, veces-su-promedio, tasa y datos de horario. */
export function enrich(posts, competitors) {
  const byId = Object.fromEntries(competitors.map((c) => [c.id, c]));
  const now = Date.now();
  const medians = {};
  for (const c of competitors) {
    const mine = posts.filter(
      (p) => p.competitor_id === c.id && p.posted_at && now - new Date(p.posted_at).getTime() > FRESH_DAYS * DAY_MS
    );
    medians[c.id] = median(mine.map(interactionsOf));
  }
  return posts.map((p) => {
    const c = byId[p.competitor_id];
    const inter = interactionsOf(p);
    const med = medians[p.competitor_id];
    const ageDays = p.posted_at ? (now - new Date(p.posted_at).getTime()) / DAY_MS : null;
    const wh = p.posted_at ? arWeekdayHour(p.posted_at) : null;
    return {
      ...p,
      _c: c,
      _inter: inter,
      _mult: inter != null && med ? inter / med : null,
      _rate: inter != null && c?.followers ? (inter / c.followers) * 100 : null,
      _fresh: ageDays != null && ageDays <= FRESH_DAYS,
      _age: ageDays,
      _weekday: wh?.weekday ?? null,
      _slot: wh ? SLOTS.find((s) => wh.hour >= s.from && wh.hour < s.to)?.id ?? null : null,
      _length: lengthOf(p.caption),
      _hook: firstLine(p.caption),
    };
  });
}

/** Resumen por cuenta: mediana de interacciones, tasa típica, ritmo y formato estrella. */
export function accountStats(c, posts) {
  const mine = posts.filter((p) => p.competitor_id === c.id);
  const ripe = mine.filter((p) => !p._fresh);
  const last30 = mine.filter((p) => p._age != null && p._age <= 30);
  const med = median(ripe.map((p) => p._inter));
  const byFormat = groupAvg(ripe, (p) => p.format, (p) => p._mult);
  return {
    posts: mine.length,
    median: med,
    rate: med != null && c.followers ? (med / c.followers) * 100 : null,
    perWeek: last30.length ? (last30.length / 30) * 7 : 0,
    bestFormat: byFormat.find((g) => g.n >= 3) || null,
  };
}

/** Agrupa y promedia `valueFn`. Devuelve [{ key, avg, n }] ordenado de mayor a menor. */
export function groupAvg(posts, keyFn, valueFn, keys) {
  const map = new Map();
  for (const p of posts) {
    const k = keyFn(p);
    const v = valueFn(p);
    if (k == null || v == null || !Number.isFinite(v)) continue;
    const g = map.get(k) || { key: k, sum: 0, n: 0 };
    g.sum += v;
    g.n += 1;
    map.set(k, g);
  }
  const rows = (keys ? keys.map((k) => map.get(k) || { key: k, sum: 0, n: 0 }) : [...map.values()]).map((g) => ({
    ...g,
    avg: g.n ? g.sum / g.n : null,
  }));
  return keys ? rows : rows.sort((a, b) => b.avg - a.avg);
}
