import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getLinkForRedirect, buildDestination } from "@/lib/marketing/links/data";
import { SITE, SLUG_RE, deviceFromUA, hostToNetwork, refererHost, SITE_HOSTS } from "@/lib/marketing/links/shared";

// Links cortos: databymilo.me/go/<slug> → destino (302), registrando el click.
// El click se guarda después de responder (waitUntil de Vercel) para no demorar la redirección.

export const dynamic = "force-dynamic";

const NETWORK_RE = /^[a-z0-9-]{2,20}$/;

/** Igual que waitUntil de @vercel/functions: deja terminar la promesa después de responder. */
function waitUntil(promise) {
  const ctx = globalThis[Symbol.for("@vercel/request-context")]?.get?.();
  if (ctx?.waitUntil) ctx.waitUntil(promise);
  else promise.catch(() => {});
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

function visitorHash(ip, ua) {
  if (!ip) return null;
  const salt = process.env.MK_LINKS_SALT || process.env.ADMIN_SESSION_SECRET || "databymilo";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${day}|${salt}`).digest("hex").slice(0, 20);
}

async function recordClick(row) {
  try {
    const { error } = await getSupabaseAdmin().from("mk_links_clicks").insert(row);
    if (error) console.error("go: no se pudo guardar el click:", error.message);
  } catch (err) {
    console.error("go: no se pudo guardar el click:", err.message);
  }
}

async function handle(request, { params }, countClick) {
  const slug = String(params.slug || "").toLowerCase();
  if (!SLUG_RE.test(slug)) return redirect(`${SITE}/links`);

  let link = null;
  try {
    link = await getLinkForRedirect(slug);
  } catch (err) {
    console.error("go: error buscando el link:", err.message);
    return redirect(SITE);
  }
  if (!link || !link.active) return redirect(`${SITE}/links`);

  const url = new URL(request.url);
  const via = url.searchParams.get("via") === "bio" ? "bio" : "direct";
  const fromParam = (url.searchParams.get("from") || "").toLowerCase();
  const from = NETWORK_RE.test(fromParam) ? fromParam : null;

  const h = request.headers;
  const refHost = refererHost(h.get("referer"));
  const refNetwork = refHost && !SITE_HOSTS.includes(refHost) ? hostToNetwork(refHost) : null;
  const network = link.network || from || refNetwork || null;

  const location = buildDestination(link, { network, via });

  if (countClick && !url.searchParams.has("preview")) {
    const ua = h.get("user-agent") || "";
    const device = deviceFromUA(ua);
    const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
    waitUntil(
      recordClick({
        link_id: link.id,
        slug,
        via,
        network,
        campaign: link.campaign || null,
        referer_host: refHost,
        referer_network: refNetwork,
        country: h.get("x-vercel-ip-country") || null,
        device,
        is_bot: device === "bot" || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch") || false,
        visitor_hash: visitorHash(ip, ua),
      })
    );
  }

  return redirect(location);
}

export function GET(request, ctx) {
  return handle(request, ctx, true);
}

export function HEAD(request, ctx) {
  return handle(request, ctx, false);
}
