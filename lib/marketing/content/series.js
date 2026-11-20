// Series recurrentes (mk_series): validación de la cadencia y armado de las
// piezas de las próximas semanas sin duplicar fechas ya generadas.

import { NETWORK_BY_ID, FORMAT_BY_ID } from "@/lib/marketing/constants";
import { arDateKey, arToISO, addDaysKey, weekdayOfKey, diffDaysKey, weekStartKey, WEEKDAYS } from "./dates";
import { isUuid, CONTENT_TABLE } from "./index";

export const SERIES_TABLE = "mk_series";
export const FREQS = [
  { id: "weekly", label: "Semanal" },
  { id: "biweekly", label: "Quincenal" },
];

export function cadenceLabel(cadence) {
  const c = cadence || {};
  if (c.weekday == null) return "Sin cadencia";
  const freq = c.freq === "biweekly" ? "Cada 2 semanas" : "Todas las semanas";
  return `${freq}, ${WEEKDAYS[c.weekday]}${c.time ? ` ${c.time}` : ""}`;
}

export function validateCadence(input) {
  const c = input || {};
  const freq = c.freq === "biweekly" ? "biweekly" : "weekly";
  const weekday = Math.round(Number(c.weekday));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { error: "Elegí un día de la semana" };
  const time = /^\d{2}:\d{2}$/.test(c.time || "") ? c.time : "10:00";
  const out = { freq, weekday, time };
  // Las quincenales necesitan una semana de referencia para saber cuál toca.
  if (freq === "biweekly") {
    out.anchor = /^\d{4}-\d{2}-\d{2}$/.test(c.anchor || "") ? c.anchor : arDateKey();
  }
  return { data: out };
}

export function validateSeries(input, { partial = false } = {}) {
  if (!input || typeof input !== "object") return { error: "Datos inválidos" };
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);
  if (!partial || has("name")) {
    const name = String(input.name || "").trim().slice(0, 120);
    if (!name) return { error: "La serie necesita un nombre" };
    data.name = name;
  }
  if (has("description")) data.description = String(input.description || "").trim().slice(0, 1000) || null;
  if (has("pillar_id")) {
    if (input.pillar_id && !isUuid(input.pillar_id)) return { error: "Pilar inválido" };
    data.pillar_id = input.pillar_id || null;
  }
  if (has("network")) {
    if (input.network && !NETWORK_BY_ID[input.network]) return { error: "Red desconocida" };
    data.network = input.network || null;
  }
  if (has("format")) {
    if (input.format && !FORMAT_BY_ID[input.format]) return { error: "Formato desconocido" };
    data.format = input.format || null;
  }
  if (has("cadence") || !partial) {
    const c = validateCadence(input.cadence);
    if (c.error) return c;
    data.cadence = c.data;
  }
  if (has("active")) data.active = !!input.active;
  return { data };
}

/** Días ("YYYY-MM-DD") que le tocan a la serie en las próximas `weeks` semanas. */
export function seriesDates(series, { weeks = 4, fromKey = arDateKey() } = {}) {
  const c = series?.cadence || {};
  if (c.weekday == null) return [];
  const offset = (c.weekday - weekdayOfKey(fromKey) + 7) % 7;
  let day = addDaysKey(fromKey, offset);
  const end = addDaysKey(fromKey, weeks * 7);
  const out = [];
  const anchorWeek = c.anchor ? weekStartKey(c.anchor) : null;
  while (day < end) {
    const ok =
      c.freq !== "biweekly" ||
      !anchorWeek ||
      Math.abs(diffDaysKey(anchorWeek, weekStartKey(day)) / 7) % 2 === 0;
    if (ok) out.push(day);
    day = addDaysKey(day, 7);
  }
  return out;
}

/** Arma las filas de mk_content para las fechas que todavía no existen. */
export function buildSeriesPieces(series, { weeks = 4, fromKey, existingKeys = [] } = {}) {
  const taken = new Set(existingKeys);
  const time = series?.cadence?.time || "10:00";
  return seriesDates(series, { weeks, fromKey })
    .filter((day) => !taken.has(day))
    .map((day) => ({
      title: series.name,
      status: "guion",
      network: series.network || null,
      format: series.format || null,
      pillar_id: series.pillar_id || null,
      series_id: series.id,
      scheduled_at: arToISO(day, time),
      source: "serie",
      tags: [],
    }));
}

/** Genera y guarda las piezas de una serie. Devuelve { data: { created, skipped } }. */
export async function generateSeriesPieces(supabase, seriesId, { weeks = 4 } = {}) {
  if (!isUuid(seriesId)) return { error: "Id inválido", status: 400 };
  const n = Math.min(Math.max(Math.round(Number(weeks)) || 4, 1), 26);
  const { data: series, error } = await supabase.from(SERIES_TABLE).select("*").eq("id", seriesId).maybeSingle();
  if (error) return { error: error.message, status: 500 };
  if (!series) return { error: "No existe esa serie", status: 404 };

  const fromKey = arDateKey();
  const dates = seriesDates(series, { weeks: n, fromKey });
  if (!dates.length) return { error: "La serie no tiene cadencia", status: 400 };

  // Fechas ya generadas (cualquier estado, también descartadas: si una se
  // descartó a propósito no se vuelve a crear).
  const { data: existing, error: exErr } = await supabase
    .from(CONTENT_TABLE)
    .select("scheduled_at")
    .eq("series_id", seriesId)
    .not("scheduled_at", "is", null);
  if (exErr) return { error: exErr.message, status: 500 };
  const existingKeys = (existing || []).map((r) => arDateKey(r.scheduled_at));

  const rows = buildSeriesPieces(series, { weeks: n, fromKey, existingKeys });
  if (rows.length) {
    const { error: insErr } = await supabase.from(CONTENT_TABLE).insert(rows);
    if (insErr) return { error: insErr.message, status: 500 };
  }
  return { data: { created: rows.length, skipped: dates.length - rows.length } };
}
