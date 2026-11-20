import { createHmac, timingSafeEqual } from "crypto";

// Sin secreto configurado se falla en vez de firmar con un valor fijo del código
// (cualquiera podría falsificar links de baja). Se lee al usarlo, no al importar,
// para no romper el build.
function getSecret() {
  const secret = process.env.UNSUB_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("UNSUB_SECRET o ADMIN_SESSION_SECRET no configurado");
  return secret;
}

export function makeUnsubToken(email) {
  const sig = createHmac("sha256", getSecret()).update(email.toLowerCase()).digest("hex");
  return Buffer.from(`${email.toLowerCase()}|${sig}`).toString("base64url");
}

export function parseUnsubToken(token) {
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const idx = decoded.lastIndexOf("|");
  if (idx === -1) return null;
  const email = decoded.slice(0, idx);
  const sig = decoded.slice(idx + 1);
  let expected;
  try {
    expected = createHmac("sha256", getSecret()).update(email).digest("hex");
  } catch {
    return null;
  }
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return email;
}
