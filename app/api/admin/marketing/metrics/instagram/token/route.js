import { getSupabaseAdmin } from "@/lib/supabase";
import { instagramUnifiedProfile } from "@/lib/marketing/metrics/meta";
import { saveAccount } from "@/lib/marketing/metrics/store";
import { runSync } from "@/lib/marketing/metrics/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Conecta Instagram con un token del panel de Meta (Unified login → "Generate token").
// Body: { token }. Se valida leyendo el perfil antes de guardar. Nunca se devuelve el token.
export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body?.token || "").trim();
    if (token.length < 30 || /\s/.test(token)) {
      return Response.json({ error: "Pegá el token completo, sin espacios ni saltos de línea" }, { status: 400 });
    }

    let profile;
    try {
      profile = await instagramUnifiedProfile(token);
    } catch (err) {
      return Response.json({ error: `Meta no aceptó el token: ${err.message}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    await saveAccount(
      supabase,
      "instagram",
      {
        access_token: token,
        token_expires_at: null,
        handle: profile.username || null,
        external_id: profile.id || null,
        connected_at: now,
      },
      { login: "unified", token_issued_at: now, last_error: null, token_refresh_error: null }
    );
    await supabase.from("mk_metrics_alerts").delete().eq("network", "instagram");

    const sync = await runSync(supabase, { networks: ["instagram"], notify: false });
    return Response.json({
      ok: true,
      account: { username: profile.username || null, followers: profile.followers_count ?? null },
      sync,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
