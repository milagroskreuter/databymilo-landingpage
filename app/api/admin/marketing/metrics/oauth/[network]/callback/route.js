import { getSupabaseAdmin } from "@/lib/supabase";
import { OAUTH_NETWORKS, redirectUri } from "@/lib/marketing/metrics/config";
import { exchangeCode, instagramProfile, threadsProfile } from "@/lib/marketing/metrics/meta";
import { saveAccount } from "@/lib/marketing/metrics/store";
import { runSync } from "@/lib/marketing/metrics/sync";
import { resolveIssue } from "@/lib/marketing/metrics/alerts";
import { STATE_COOKIE, checkState, clearStateCookie } from "@/lib/marketing/metrics/oauthState";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = "/administracion-general/marketing/metricas";

function back(request, query) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(`${PAGE}?${new URLSearchParams(query)}`, url.origin).toString(),
      "Set-Cookie": clearStateCookie(url.protocol === "https:"),
      "Cache-Control": "no-store",
    },
  });
}

// Meta vuelve acá con ?code=...&state=... después de autorizar.
// (La ruta está bajo /api/admin, así que el middleware ya exige la sesión de admin.)
export async function GET(request, { params }) {
  const { network } = params;
  const url = new URL(request.url);
  if (!OAUTH_NETWORKS.includes(network)) return back(request, { error: "Red inválida" });

  if (url.searchParams.get("error")) {
    const denied =
      url.searchParams.get("error_reason") === "user_denied" || url.searchParams.get("error") === "access_denied";
    return back(request, {
      error: denied ? "Cancelaste la autorización" : url.searchParams.get("error_description") || "Meta devolvió un error",
    });
  }

  const cookie = request.cookies.get(STATE_COOKIE)?.value;
  if (!checkState(cookie, network, url.searchParams.get("state"))) {
    return back(request, { error: "La autorización expiró o no coincide. Probá conectar de nuevo." });
  }
  const code = url.searchParams.get("code");
  if (!code) return back(request, { error: "Meta no devolvió el código de autorización" });

  try {
    const token = await exchangeCode(network, { code, redirectUri: redirectUri(network, request) });
    const profile =
      network === "instagram" ? await instagramProfile(token.access_token) : await threadsProfile(token.access_token);
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    await saveAccount(
      supabase,
      network,
      {
        handle: profile.username || null,
        external_id: String(profile.id || token.user_id || "") || null,
        access_token: token.access_token,
        token_expires_at: token.expires_at,
        connected_at: now,
      },
      { token_issued_at: now, token_refresh_error: null, last_error: null, permissions: token.permissions }
    );
    await resolveIssue(supabase, network, "token");
    await runSync(supabase, { networks: [network], notify: false });
    return back(request, { connected: network });
  } catch (err) {
    console.error(`oauth ${network}:`, err.message);
    return back(request, { error: `No se pudo conectar: ${err.message}` });
  }
}
