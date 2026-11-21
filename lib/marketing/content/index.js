// Validación y armado de piezas de contenido (tabla mk_content).
// Lo usan el calendario, el banco de ideas, las series y otras áreas: cualquier
// lugar que cree o edite piezas tiene que pasar por acá para que los datos
// queden con el mismo formato.

import { NETWORK_BY_ID, STATUS_BY_ID, FORMAT_BY_ID, CONTENT_SOURCES } from "@/lib/marketing/constants";

export const CONTENT_TABLE = "mk_content";

// Estados en orden de avance (descartado queda aparte).
export const PIPELINE = ["idea", "guion", "grabado", "editado", "programado", "publicado"];
// Estados que ya no requieren acción.
export const CLOSED_STATUSES = ["publicado", "descartado"];

// Campos que se pueden escribir desde afuera (el resto lo maneja la base).
export const CONTENT_FIELDS = [
  "title", "status", "network", "format", "pillar_id", "series_id", "launch_id",
  "scheduled_at", "published_at", "hook", "script", "caption", "cta", "notes",
  "tags", "source", "blog_slug", "permalink", "external_id", "score", "variant_of",
];

const TEXT_LIMITS = {
  title: 200, hook: 1000, script: 20000, caption: 5000, cta: 500, notes: 10000,
  blog_slug: 200, permalink: 1000, external_id: 200,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(v, max) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

/** Convierte "a, b #c" o ["a","b"] en etiquetas limpias, sin repetir. */
export function normalizeTags(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : String(value).split(/[,\n]+/);
  const out = [];
  for (const raw of list) {
    const t = String(raw).trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-").slice(0, 40);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 20);
}

/** Separa "#etiquetas" del texto de una captura rápida. */
export function parseQuickIdea(text) {
  const tags = [];
  const title = String(text || "")
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, sp, tag) => {
      tags.push(tag);
      return sp;
    })
    .replace(/\s+/g, " ")
    .trim();
  return { title, tags: normalizeTags(tags) };
}

function toISO(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Valida y limpia los datos de una pieza.
 * - partial=false (crear): exige título y completa valores por defecto.
 * - partial=true (editar): solo devuelve los campos que vinieron.
 * Devuelve { data } o { error } con un mensaje para mostrar.
 */
export function validateContent(input, { partial = false } = {}) {
  if (!input || typeof input !== "object") return { error: "Datos inválidos" };
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);

  if (!partial || has("title")) {
    const title = cleanText(input.title, TEXT_LIMITS.title);
    if (!title) return { error: "La pieza necesita un título" };
    data.title = title;
  }

  if (has("status") || !partial) {
    const status = input.status || "idea";
    if (!STATUS_BY_ID[status]) return { error: `Estado desconocido: ${status}` };
    data.status = status;
  }

  for (const [key, map, label] of [
    ["network", NETWORK_BY_ID, "Red"],
    ["format", FORMAT_BY_ID, "Formato"],
  ]) {
    if (!has(key)) continue;
    const v = input[key] || null;
    if (v && !map[v]) return { error: `${label} desconocida: ${v}` };
    data[key] = v;
  }

  for (const key of ["pillar_id", "series_id", "launch_id", "variant_of"]) {
    if (!has(key)) continue;
    const v = input[key] || null;
    if (v && !UUID_RE.test(v)) return { error: `Id inválido en ${key}` };
    data[key] = v;
  }

  for (const key of ["scheduled_at", "published_at"]) {
    if (!has(key)) continue;
    const iso = toISO(input[key]);
    if (iso === undefined) return { error: "Fecha inválida" };
    data[key] = iso;
  }

  for (const key of ["hook", "script", "caption", "cta", "notes", "blog_slug", "external_id"]) {
    if (has(key)) data[key] = cleanText(input[key], TEXT_LIMITS[key]);
  }

  if (has("permalink")) {
    const p = cleanText(input.permalink, TEXT_LIMITS.permalink);
    if (p && !/^https?:\/\//i.test(p)) return { error: "El permalink tiene que empezar con http:// o https://" };
    data.permalink = p;
  }

  if (has("tags") || !partial) data.tags = normalizeTags(input.tags);

  if (has("source") || !partial) {
    const source = input.source || "manual";
    if (!CONTENT_SOURCES.includes(source)) return { error: `Origen desconocido: ${source}` };
    data.source = source;
  }

  if (has("score")) {
    if (input.score == null || input.score === "") data.score = null;
    else {
      const n = Math.round(Number(input.score));
      if (!Number.isFinite(n) || n < 1 || n > 5) return { error: "El puntaje va de 1 a 5" };
      data.score = n;
    }
  }

  return { data };
}

/**
 * Ajustes automáticos según el estado (se aplican después de validar):
 * al pasar a publicado se guarda la fecha de publicación si no había.
 * `current` es la fila actual cuando se edita.
 */
export function applyStatusRules(data, current = null) {
  const out = { ...data };
  const status = out.status ?? current?.status;
  const publishedAt = "published_at" in out ? out.published_at : current?.published_at;
  if (status === "publicado" && !publishedAt) {
    out.published_at = out.scheduled_at || current?.scheduled_at || new Date().toISOString();
  }
  return out;
}

export const CONTENT_SELECT = "*";

/** Crea una pieza. Devuelve { data } o { error, status }. */
export async function createContent(supabase, input) {
  const { data, error } = validateContent(input);
  if (error) return { error, status: 400 };
  const row = applyStatusRules(data);
  const res = await supabase.from(CONTENT_TABLE).insert(row).select(CONTENT_SELECT).single();
  if (res.error) return { error: res.error.message, status: 500 };
  return { data: res.data };
}

/** Edita una pieza (solo los campos que vienen). */
export async function updateContent(supabase, id, input) {
  if (!UUID_RE.test(id || "")) return { error: "Id inválido", status: 400 };
  const { data, error } = validateContent(input, { partial: true });
  if (error) return { error, status: 400 };
  if (!Object.keys(data).length) return { error: "No hay cambios", status: 400 };

  let current = null;
  if (data.status === "publicado" || "published_at" in data) {
    const cur = await supabase.from(CONTENT_TABLE).select("status, scheduled_at, published_at").eq("id", id).maybeSingle();
    current = cur.data;
  }
  const row = { ...applyStatusRules(data, current), updated_at: new Date().toISOString() };
  const res = await supabase.from(CONTENT_TABLE).update(row).eq("id", id).select(CONTENT_SELECT).maybeSingle();
  if (res.error) return { error: res.error.message, status: 500 };
  if (!res.data) return { error: "No existe esa pieza", status: 404 };
  return { data: res.data };
}

export async function deleteContent(supabase, id) {
  if (!UUID_RE.test(id || "")) return { error: "Id inválido", status: 400 };
  const { error } = await supabase.from(CONTENT_TABLE).delete().eq("id", id);
  if (error) return { error: error.message, status: 500 };
  return { data: { ok: true } };
}

/**
 * Lista piezas con filtros opcionales:
 * { status, network, pillar_id, series_id, from, to (ISO), q, ideas (bool), limit }
 */
export async function listContent(supabase, filters = {}) {
  let query = supabase.from(CONTENT_TABLE).select(CONTENT_SELECT);
  if (filters.ideas) query = query.eq("status", "idea");
  else if (filters.status) query = query.eq("status", filters.status);
  if (filters.network) query = query.eq("network", filters.network);
  if (filters.pillar_id) query = query.eq("pillar_id", filters.pillar_id);
  if (filters.series_id) query = query.eq("series_id", filters.series_id);
  // Todas las versiones de una idea: la original y las que apuntan a ella.
  if (filters.group && UUID_RE.test(filters.group)) query = query.or(`id.eq.${filters.group},variant_of.eq.${filters.group}`);
  if (filters.from) query = query.gte("scheduled_at", filters.from);
  if (filters.to) query = query.lt("scheduled_at", filters.to);
  if (filters.q) {
    const q = String(filters.q).replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,hook.ilike.%${q}%,notes.ilike.%${q}%`);
  }
  query = query
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(Math.min(Number(filters.limit) || 2000, 5000));
  const { data, error } = await query;
  if (error) return { error: error.message, status: 500 };
  return { data: data || [] };
}

export function isUuid(v) {
  return UUID_RE.test(v || "");
}
