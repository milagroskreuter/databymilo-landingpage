import { OAUTH_NETWORKS, envStatus, redirectUri } from "@/lib/marketing/metrics/config";
import { authorizeUrl } from "@/lib/marketing/metrics/meta";
import { newState, stateCookie } from "@/lib/marketing/metrics/oauthState";

export const dynamic = "force-dynamic";

const PAGE = "/administracion-general/marketing/metricas";

function redirectTo(request, query) {
  const url = new URL(request.url);
  return Response.redirect(new URL(`${PAGE}?${new URLSearchParams(query)}`, url.origin), 302);
}

// Botón "Conectar Instagram/Threads": manda a la pantalla de autorización de Meta.
export async function GET(request, { params }) {
  const { network } = params;
  const url = new URL(request.url);
  if (!OAUTH_NETWORKS.includes(network)) return redirectTo(request, { error: "Red inválida" });
  if (!envStatus()[network]) {
    const prefix = network === "instagram" ? "INSTAGRAM" : "THREADS";
    return redirectTo(request, { error: `Faltan ${prefix}_APP_ID y ${prefix}_APP_SECRET en Vercel` });
  }
  const state = newState();
  const target = authorizeUrl(network, { redirectUri: redirectUri(network, request), state });
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      "Set-Cookie": stateCookie(network, state, url.protocol === "https:"),
      "Cache-Control": "no-store",
    },
  });
}
