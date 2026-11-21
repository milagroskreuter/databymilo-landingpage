// Canva Connect API (https://www.canva.dev/docs/connect/).
// OAuth con PKCE: el code_verifier y el state se guardan en mk_brand_integrations
// (nunca llegan al navegador) y los tokens también, solo accesibles con la service key.
// El autofill (diseños desde una plantilla con datos) está disponible cuando la
// usuaria tiene Canva Pro, Teams o Enterprise.
import { getSupabaseAdmin } from "@/lib/supabase";

const AUTH_URL = "https://www.canva.com/api/oauth/authorize";
const API = "https://api.canva.com/rest/v1";

// Tienen que estar habilitados también en el portal de desarrolladores de Canva.
export const CANVA_SCOPES = [
  "profile:read",
  "design:meta:read",
  "design:content:read",
  "design:content:write",
  "brandtemplate:meta:read",
  "brandtemplate:content:read",
  "asset:read",
];

export function canvaConfigured() {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

export function redirectUri(request) {
  if (process.env.CANVA_REDIRECT_URI) return process.env.CANVA_REDIRECT_URI;
  const { origin } = new URL(request.url);
  return `${origin}/api/admin/marketing/brand/canva/callback`;
}

function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getRow(supabase) {
  const { data } = await supabase.from("mk_brand_integrations").select("*").eq("provider", "canva").maybeSingle();
  return data;
}

async function saveRow(supabase, patch) {
  const { error } = await supabase
    .from("mk_brand_integrations")
    .upsert({ provider: "canva", ...patch, updated_at: new Date().toISOString() }, { onConflict: "provider" });
  if (error) throw new Error(error.message);
}

/** Arma la URL de autorización y guarda el verifier/state pendientes. */
export async function startAuth(request) {
  const supabase = getSupabaseAdmin();
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const row = await getRow(supabase);
  await saveRow(supabase, { meta: { ...(row?.meta || {}), pending: { state, verifier, at: Date.now() } } });

  const sp = new URLSearchParams({
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: CANVA_SCOPES.join(" "),
    response_type: "code",
    client_id: process.env.CANVA_CLIENT_ID,
    state,
    redirect_uri: redirectUri(request),
  });
  return `${AUTH_URL}?${sp}`;
}

async function tokenRequest(body) {
  const basic = btoa(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`);
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.message || `Canva respondió ${res.status}`);
  return data;
}

function tokenPatch(t) {
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 3600) * 1000).toISOString(),
  };
}

/** Cambia el code por tokens (callback del OAuth). */
export async function finishAuth(request, { code, state }) {
  const supabase = getSupabaseAdmin();
  const row = await getRow(supabase);
  const pending = row?.meta?.pending;
  if (!pending || !state || pending.state !== state) throw new Error("El estado del login no coincide. Probá conectar de nuevo.");
  if (Date.now() - pending.at > 15 * 60 * 1000) throw new Error("El login venció. Probá conectar de nuevo.");

  const t = await tokenRequest({
    grant_type: "authorization_code",
    code,
    code_verifier: pending.verifier,
    redirect_uri: redirectUri(request),
  });
  const meta = { ...(row?.meta || {}) };
  delete meta.pending;
  meta.connected_at = new Date().toISOString();
  await saveRow(supabase, { ...tokenPatch(t), meta });

  // Nombre de la cuenta, para mostrarlo en la pestaña.
  try {
    const me = await canvaFetch("/users/me/profile");
    await saveRow(supabase, { meta: { ...meta, display_name: me?.profile?.display_name || null } });
  } catch {
    /* no es crítico */
  }
}

/** Token vigente (lo renueva si está por vencer). Devuelve null si no hay conexión. */
async function accessToken(supabase) {
  const row = await getRow(supabase);
  if (!row?.access_token) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() - Date.now() > 60_000) return row.access_token;
  if (!row.refresh_token) return null;
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: row.refresh_token });
  await saveRow(supabase, tokenPatch(t));
  return t.access_token;
}

export async function canvaStatus() {
  const supabase = getSupabaseAdmin();
  const row = await getRow(supabase);
  return {
    configured: canvaConfigured(),
    connected: Boolean(row?.access_token),
    displayName: row?.meta?.display_name || null,
    connectedAt: row?.meta?.connected_at || null,
  };
}

export async function disconnect() {
  const supabase = getSupabaseAdmin();
  await supabase.from("mk_brand_integrations").delete().eq("provider", "canva");
}

export class CanvaError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Llamada autenticada a la API de Canva. */
export async function canvaFetch(path, init = {}) {
  const token = await accessToken(getSupabaseAdmin());
  if (!token) throw new CanvaError("Canva no está conectado", 401);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `Canva respondió ${res.status}`;
    throw new CanvaError(msg, res.status);
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera un job asíncrono de Canva (exportación o autofill). */
export async function waitJob(path, { timeoutMs = 25_000 } = {}) {
  const start = Date.now();
  let delay = 800;
  while (Date.now() - start < timeoutMs) {
    const { job } = await canvaFetch(path);
    if (job?.status === "success") return job;
    if (job?.status === "failed") throw new CanvaError(job?.error?.message || "Canva no pudo terminar el trabajo", 502);
    await sleep(delay);
    delay = Math.min(delay * 1.5, 3000);
  }
  throw new CanvaError("Canva está tardando. Probá de nuevo en un rato.", 504);
}
