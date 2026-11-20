// In-memory rate limiter per serverless instance.
// Not distributed, but effective against naive abuse.
const store = new Map();

// Limpia entradas vencidas para que el Map no crezca sin limite en instancias largas.
function prune(now) {
  if (store.size < 5000) return;
  for (const [k, v] of store) if (now > v.reset) store.delete(k);
}

export function rateLimit(key, { max = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  prune(now);
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
