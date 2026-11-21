// Utilidades del área Comunidad (testimonios, preguntas, menciones).
// Se usan tanto en las rutas públicas como en las del admin: solo servidor.
import { NETWORKS } from "@/lib/marketing/constants";

export const PUBLIC_BUCKET = "mk-community"; // fotos de testimonios (se muestran en el sitio)
export const PRIVATE_BUCKET = "mk-community-private"; // capturas de menciones

export const TESTIMONIAL_STATUSES = ["pending", "approved", "rejected"];

// Redes válidas para preguntas y menciones: las de marketing + canales sueltos.
export const COMMUNITY_NETWORK_IDS = [...NETWORKS.map((n) => n.id), "email", "otro"];

/** Texto de una línea: sin etiquetas, sin caracteres de control, recortado. */
export function cleanLine(value, max = 120) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Texto largo: conserva saltos de línea (máximo dos seguidos). */
export function cleanText(value, max = 2000) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[<>\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** Solo links http(s) válidos; si no, cadena vacía. */
export function cleanUrl(value, max = 500) {
  const raw = cleanLine(value, max);
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    if (!u.hostname.includes(".")) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export function cleanNetwork(value) {
  return COMMUNITY_NETWORK_IDS.includes(value) ? value : null;
}

/** Etiquetas: minúsculas, sin repetir, cortas. Acepta array o "a, b, c". */
export function cleanTags(value, { max = 12, len = 40 } = {}) {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out = [];
  for (const item of list) {
    const t = cleanLine(String(item ?? ""), len).toLowerCase();
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Slugs de recursos (productos). */
export function cleanSlugs(value, max = 10) {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out = [];
  for (const item of list) {
    const s = String(item ?? "").trim().toLowerCase();
    if (/^[a-z0-9][a-z0-9-]{0,79}$/.test(s) && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function cleanDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : value;
}

/**
 * Revisa que el archivo sea de verdad una imagen (por sus primeros bytes, no
 * por lo que dice el navegador) y devuelve { ext, type } o null.
 */
export function sniffImage(bytes, { allowGif = false } = {}) {
  const b = bytes;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return { ext: "webp", type: "image/webp" };
  if (allowGif && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: "gif", type: "image/gif" };
  return null;
}

/**
 * Sube una imagen a Storage. Devuelve el path guardado o lanza con un mensaje para mostrar.
 * `file` es un File/Blob de request.formData().
 */
export async function uploadImage(supabase, file, { bucket, folder, maxBytes, allowGif = false }) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  if (file.size > maxBytes) {
    throw new Error(`La imagen pesa demasiado (máximo ${Math.round(maxBytes / 1024 / 1024)} MB)`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes, { allowGif });
  if (!kind) throw new Error("El archivo no parece una imagen (JPG, PNG o WebP)");

  const path = `${folder}/${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: kind.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}

export function publicPhotoUrl(path) {
  if (!path || !process.env.SUPABASE_URL) return null;
  return `${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}

export async function removeFiles(supabase, bucket, paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;
  const { error } = await supabase.storage.from(bucket).remove(list);
  if (error) console.error(`community: no se pudieron borrar archivos de ${bucket}:`, error.message);
}
