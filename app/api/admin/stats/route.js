export const dynamic = "force-dynamic";

const PROJECT_ID = "prj_FCuvSA8k1Yw4jXIsAtHuE6FpB5V8";
const TEAM_ID = "team_RbmJFWA5dPjwZTThOy3Mfl8v";
const BASE = "https://api.vercel.com/v1/query/web-analytics";

function dateRange(days) {
  const until = new Date();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

async function vaFetch(path, params, token) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("projectId", PROJECT_ID);
  url.searchParams.set("teamId", TEAM_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Vercel Analytics ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(request) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "VERCEL_API_TOKEN no configurado", setup: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const { since, until } = dateRange(days);
  const range = { since, until };

  try {
    const [counts, pages, referrers, devices, countries, browsers, dailyViews] =
      await Promise.allSettled([
        vaFetch("/visits/count", range, token),
        vaFetch("/visits/aggregate", { ...range, by: "requestPath", limit: "10" }, token),
        vaFetch("/visits/aggregate", { ...range, by: "referrerHostname", limit: "10" }, token),
        vaFetch("/visits/aggregate", { ...range, by: "deviceType" }, token),
        vaFetch("/visits/aggregate", { ...range, by: "country", limit: "8" }, token),
        vaFetch("/visits/aggregate", { ...range, by: "browserName", limit: "6" }, token),
        vaFetch("/visits/aggregate", { ...range, by: "day", limit: "90" }, token),
      ]);

    const ok = (r) => (r.status === "fulfilled" ? r.value?.data ?? null : null);

    return Response.json({
      days,
      since,
      until,
      overview: ok(counts),
      pages: ok(pages),
      referrers: ok(referrers),
      devices: ok(devices),
      countries: ok(countries),
      browsers: ok(browsers),
      dailyViews: ok(dailyViews),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
