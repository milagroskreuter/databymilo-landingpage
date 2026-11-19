import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.UNSUB_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "fallback-change-me";

export function makeUnsubToken(email) {
  const sig = createHmac("sha256", SECRET).update(email.toLowerCase()).digest("hex");
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
  const expected = createHmac("sha256", SECRET).update(email).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return email;
}
