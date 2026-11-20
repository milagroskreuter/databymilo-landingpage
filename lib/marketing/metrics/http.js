// fetch con timeout que devuelve JSON o lanza un Error con el mensaje de la API.
// Nunca incluye el token en el mensaje de error.

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function apiMessage(data, status) {
  const e = data?.error;
  if (typeof e === "string") return data.error_description || data.error_message || e;
  if (e?.message) return e.message;
  if (data?.error_message) return data.error_message;
  return `HTTP ${status}`;
}

export async function fetchJson(url, { method = "GET", body, headers, timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { method, body, headers, signal: controller.signal, cache: "no-store" });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || data?.error) {
      throw new ApiError(apiMessage(data, res.status), {
        status: res.status,
        code: data?.error?.code ?? data?.code,
        data,
      });
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new ApiError("La red tardó demasiado en responder");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Convierte un objeto en query string, salteando vacíos. */
export function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  return sp.toString();
}

/** Ejecuta tareas de a `size` en paralelo. */
export async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

export function toInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}
