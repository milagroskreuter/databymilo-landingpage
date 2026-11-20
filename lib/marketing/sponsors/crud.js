// Helpers de las rutas /api/admin/marketing/sponsors/*: validan el cuerpo según un
// esquema simple y arman handlers de lista/alta y de edición/baja por id.
import { revalidatePath, revalidateTag } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

export const MEDIA_KIT_TAG = "mk-media-kit";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vuelve a calcular el media kit público en la próxima visita. */
export function refreshMediaKit() {
  try {
    revalidateTag(MEDIA_KIT_TAG);
    revalidatePath("/media-kit");
  } catch (err) {
    console.error("refreshMediaKit:", err.message);
  }
}

/**
 * Esquema: { campo: tipo }. Tipos: "text" (300), "longtext" (5000), "date",
 * "number", "bool", "uuid", "url", o un array de valores permitidos.
 * Devuelve { data, error }. Con partial=true solo toma los campos presentes.
 */
export function sanitize(schema, body, { partial = false, required = [] } = {}) {
  const data = {};
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in (body || {}))) continue;
    const raw = body[key];
    let v = null;
    if (Array.isArray(type)) {
      const val = raw === "" || raw === undefined ? null : raw;
      if (!type.includes(val)) return { error: `Valor inválido para ${key}` };
      v = val;
    } else if (type === "text" || type === "longtext" || type === "url") {
      const s = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw);
      v = s ? s.slice(0, type === "longtext" ? 5000 : 300) : null;
      if (v && type === "url" && !/^https?:\/\//i.test(v)) v = `https://${v}`;
    } else if (type === "date") {
      v = typeof raw === "string" && DATE_RE.test(raw) ? raw : null;
    } else if (type === "number") {
      const n = raw === "" || raw == null ? null : Number(String(raw).replace(",", "."));
      v = n === null || Number.isFinite(n) ? n : null;
    } else if (type === "bool") {
      v = Boolean(raw);
    } else if (type === "uuid") {
      v = typeof raw === "string" && UUID_RE.test(raw) ? raw : null;
    }
    data[key] = v;
  }
  for (const key of required) {
    if ((!partial || key in data) && (data[key] === null || data[key] === undefined)) {
      return { error: `Falta completar: ${key}` };
    }
  }
  return { data };
}

export function isUuid(id) {
  return UUID_RE.test(String(id || ""));
}

const json = (body, status = 200) => Response.json(body, { status });

/** GET (lista) y POST (alta) para una tabla. */
export function collectionHandlers(table, schema, { required = [], order = [["created_at", false]], afterWrite } = {}) {
  async function GET() {
    try {
      const supabase = getSupabaseAdmin();
      let q = supabase.from(table).select("*");
      for (const [col, asc] of order) q = q.order(col, { ascending: asc, nullsFirst: false });
      const { data, error } = await q.limit(2000);
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [] });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  async function POST(request) {
    try {
      const body = await request.json().catch(() => ({}));
      const { data, error: vErr } = sanitize(schema, body, { required });
      if (vErr) return json({ error: vErr }, 400);
      const supabase = getSupabaseAdmin();
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      if (error) return json({ error: error.message }, 500);
      afterWrite?.(row);
      return json({ item: row }, 201);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  return { GET, POST };
}

/** PATCH y DELETE por id para una tabla. */
export function itemHandlers(table, schema, { required = [], afterWrite, beforeUpdate } = {}) {
  async function PATCH(request, { params }) {
    try {
      if (!isUuid(params.id)) return json({ error: "Id inválido" }, 400);
      const body = await request.json().catch(() => ({}));
      const { data, error: vErr } = sanitize(schema, body, { partial: true, required });
      if (vErr) return json({ error: vErr }, 400);
      if (!Object.keys(data).length) return json({ error: "Nada para guardar" }, 400);
      const supabase = getSupabaseAdmin();
      const patch = beforeUpdate ? await beforeUpdate(data, supabase, params.id) : data;
      patch.updated_at = new Date().toISOString();
      const { data: row, error } = await supabase.from(table).update(patch).eq("id", params.id).select().maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) return json({ error: "No existe" }, 404);
      afterWrite?.(row);
      return json({ item: row });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  async function DELETE(_request, { params }) {
    try {
      if (!isUuid(params.id)) return json({ error: "Id inválido" }, 400);
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from(table).delete().eq("id", params.id);
      if (error) return json({ error: error.message }, 500);
      afterWrite?.(null);
      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  return { PATCH, DELETE };
}
