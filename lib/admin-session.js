// Sesión de admin firmada y con vencimiento.
// La cookie lleva "v1.<vence>.<firma>" en vez del secreto en sí: si alguien la
// llegara a ver, no obtiene ADMIN_SESSION_SECRET y la sesión se vence sola.
// Usa Web Crypto para funcionar igual en el middleware (edge) y en las rutas (node).

export const SESSION_COOKIE = "admin_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días, en segundos

const encoder = new TextEncoder();

async function sign(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparación en tiempo constante (el runtime edge no trae timingSafeEqual).
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `v1.${exp}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const expected = await sign(secret, `v1.${parts[1]}`);
  return safeEqual(parts[2], expected);
}
