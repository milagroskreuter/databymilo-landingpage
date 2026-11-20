import { dateRange, vaFetch } from "@/lib/vercel-analytics";

export const dynamic = "force-dynamic";

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
