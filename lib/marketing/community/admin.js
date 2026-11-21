// Ayudas para las rutas /api/admin/marketing/community/* (protegidas por middleware.js).
import { getSupabaseAdmin } from "@/lib/supabase";
import { PRIVATE_BUCKET, publicPhotoUrl } from "./shared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(error, status = 400) {
  return json({ error }, status);
}

/** Corre `fn(supabase)` y convierte cualquier error en una respuesta 500 con mensaje. */
export async function withSupabase(fn) {
  try {
    return await fn(getSupabaseAdmin());
  } catch (err) {
    console.error("community admin:", err);
    return fail(err.message || "Error inesperado", 500);
  }
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export function adminTestimonial(row) {
  return { ...row, photo_url: publicPhotoUrl(row.photo_path) };
}

/** Agrega links firmados (1 h) a las capturas privadas de las menciones. */
export async function withScreenshotUrls(supabase, rows) {
  const paths = rows.map((r) => r.screenshot_path).filter(Boolean);
  if (!paths.length) return rows.map((r) => ({ ...r, screenshot_url: null }));
  const { data } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrls(paths, 3600);
  const byPath = Object.fromEntries((data || []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({ ...r, screenshot_url: r.screenshot_path ? byPath[r.screenshot_path] || null : null }));
}
