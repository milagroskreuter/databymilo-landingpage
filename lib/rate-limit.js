// In-memory rate limiter per serverless instance.
// Not distributed, but effective against naive abuse.
const store = new Map();

export function rateLimit(key, { max = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const entry = store.get(key) ?? { count: 0, reset: now + windowMs };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }

  entry.count += 1;
  store.set(key, entry);

  return { ok: entry.count <= max, remaining: Math.max(0, max - entry.count) };
}

export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
