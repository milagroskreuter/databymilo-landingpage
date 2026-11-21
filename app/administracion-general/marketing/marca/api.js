"use client";
// Helpers del cliente para el área Marca y diseño.

export const API = "/api/admin/marketing/brand";

/** fetch JSON que tira un Error con el mensaje del servidor. */
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path.startsWith("/") ? path : `${API}/${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

/** Medidas de una imagen local (o null si no es imagen). */
export function imageSize(file) {
  if (!file.type?.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Sube un archivo a la biblioteca: pide una URL firmada, sube directo a Supabase
 * Storage y después lo registra. Devuelve la fila del archivo.
 */
export async function uploadAsset(file, tags = []) {
  const { path, signedUrl } = await api("assets/upload-url", { method: "POST", body: { name: file.name, size: file.size } });
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file);
  const up = await fetch(signedUrl, { method: "PUT", body: form, headers: { "x-upsert": "false" } });
  if (!up.ok) {
    const err = await up.json().catch(() => ({}));
    throw new Error(err.message || err.error || `No se pudo subir ${file.name}`);
  }
  const dims = await imageSize(file);
  const { asset } = await api("assets", {
    method: "POST",
    body: { path, name: file.name, mime: file.type || null, size: file.size, ...(dims || {}), tags },
  });
  return asset;
}

/** Achica una imagen local a JPEG (lado mayor `max` px) y la devuelve como data URL. */
export function resizeToDataUrl(file, max = 1568, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pude leer la imagen"));
    };
    img.src = url;
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function formatBytes(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const linesToList = (s) =>
  String(s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
export const listToLines = (a) => (Array.isArray(a) ? a.join("\n") : "");
