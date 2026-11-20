import { createHash, timingSafeEqual } from "crypto";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Comparación en tiempo constante (se hashea para igualar los largos).
function safeEqual(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

const COOKIE_FLAGS = `Path=/; HttpOnly; SameSite=Lax${
  process.env.NODE_ENV === "production" ? "; Secure" : ""
}`;

export async function POST(request) {
  // Freno a la fuerza bruta: 8 intentos cada 15 minutos por IP.
  const { ok } = rateLimit(`admin-login:${getIp(request)}`, { max: 8, windowMs: 15 * 60_000 });
  if (!ok) {
    return Response.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const { password } = await request.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || typeof password !== "string" || !password || !safeEqual(password, expected)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return Response.json({ error: "Config faltante" }, { status: 500 });
  }

  const response = Response.json({ ok: true, redirect: "/administracion-general" });
  response.headers.set(
    "Set-Cookie",
    `admin_token=${secret}; ${COOKIE_FLAGS}; Max-Age=${60 * 60 * 24 * 30}`
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", `admin_token=; ${COOKIE_FLAGS}; Max-Age=0`);
  return response;
}
