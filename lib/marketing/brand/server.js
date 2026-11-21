// Helpers de servidor del área Marca y diseño (sistema de marca y biblioteca).
// Funciona en runtime node y edge (solo usa supabase-js y fetch).
import { getSupabaseAdmin } from "@/lib/supabase";
import { ASSET_BUCKET, BRAND_KEYS, withDefaults } from "./defaults";

export { ASSET_BUCKET };

/** Lee el sistema de marca completo (con los valores iniciales para lo que falte). */
export async function getBrand(supabase = getSupabaseAdmin()) {
  const { data, error } = await supabase.from("mk_brand").select("key, value, updated_at").in("key", BRAND_KEYS);
  if (error) throw new Error(error.message);
  const saved = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  const updated = (data || []).reduce((max, r) => (r.updated_at > max ? r.updated_at : max), "");
  return { brand: withDefaults(saved), updatedAt: updated || null };
}

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function fail(err, status = 500) {
  const message = typeof err === "string" ? err : err?.message || "Error inesperado";
  return Response.json({ error: message }, { status });
}

const SAFE = /[^a-z0-9._-]+/g;

/** Nombre de archivo seguro para la ruta del bucket. */
export function safeFileName(name = "archivo") {
  const clean = String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(SAFE, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean.slice(-80) || "archivo";
}

/** Ruta nueva dentro del bucket: <carpeta>/<año-mes>/<aleatorio>-<nombre>. */
export function newAssetPath(folder, name) {
  const ym = new Date().toISOString().slice(0, 7);
  const rand = crypto.randomUUID().slice(0, 8);
  return `${folder}/${ym}/${rand}-${safeFileName(name)}`;
}

/** Normaliza etiquetas: minúsculas, sin repetidas, sin vacías. */
export function cleanTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

/** Agrega URLs firmadas (1 h) a una lista de filas de mk_brand_assets. */
export async function withSignedUrls(supabase, rows, expiresIn = 3600) {
  if (!rows?.length) return [];
  const { data } = await supabase.storage.from(ASSET_BUCKET).createSignedUrls(rows.map((r) => r.path), expiresIn);
  const byPath = Object.fromEntries((data || []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({ ...r, url: byPath[r.path] || null }));
}

/**
 * Sube un archivo (ArrayBuffer/Blob) al bucket y lo registra en la biblioteca.
 * Devuelve la fila creada con su URL firmada.
 */
export async function saveAsset(supabase, { folder, name, body, mime, tags = [], source = "upload", meta = {}, width, height }) {
  const path = newAssetPath(folder, name);
  const { error: upErr } = await supabase.storage.from(ASSET_BUCKET).upload(path, body, {
    contentType: mime || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw new Error(`No se pudo subir el archivo: ${upErr.message}`);
  const size = body?.byteLength ?? body?.size ?? null;
  const { data, error } = await supabase
    .from("mk_brand_assets")
    .insert({ path, name, mime, size_bytes: size, tags: cleanTags(tags), source, meta, width: width || null, height: height || null })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(ASSET_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  const [row] = await withSignedUrls(supabase, [data]);
  return row;
}

/** Descarga un archivo del bucket como ArrayBuffer. */
export async function downloadAsset(supabase, path) {
  const { data, error } = await supabase.storage.from(ASSET_BUCKET).download(path);
  if (error) throw new Error(`No se pudo leer el archivo: ${error.message}`);
  return data.arrayBuffer();
}

export function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
