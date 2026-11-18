export const dynamic = "force-dynamic";

const PROJECT_ID = "prj_FCuvSA8k1Yw4jXIsAtHuE6FpB5V8";
const TEAM_ID = "team_RbmJFWA5dPjwZTThOy3Mfl8v";
const BASE = "https://vercel.com/api/v1/web";

async function vFetch(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Vercel API ${res.status}: ${text}`);
  }
  return res.json();
}

function range(days) {
  const to = Date.now();
  const from = to - days * 24 * 60 * 60 * 1000;
  return { from, to };
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
  const { from, to } = range(days);
  const qs = `projectId=${PROJECT_ID}&teamId=${TEAM_ID}&from=${from}&to=${to}`;

  try {
    const [overview, pages, referrers, devices, countries] = await Promise.allSettled([
      vFetch(`/stats?${qs}`, token),
      vFetch(`/pages?${qs}&limit=10`, token),
      vFetch(`/referrers?${qs}&limit=10`, token),
      vFetch(`/devices?${qs}`, token),
      vFetch(`/countries?${qs}&limit=8`, token),
    ]);

    return Response.json({
      days,
      overview: overview.status === "fulfilled" ? overview.value : null,
      pages: pages.status === "fulfilled" ? pages.value : null,
      referrers: referrers.status === "fulfilled" ? referrers.value : null,
      devices: devices.status === "fulfilled" ? devices.value : null,
      countries: countries.status === "fulfilled" ? countries.value : null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
