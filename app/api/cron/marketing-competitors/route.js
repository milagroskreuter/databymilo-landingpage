import { getSupabaseAdmin } from "@/lib/supabase";
import { syncCompetitors } from "@/lib/marketing/competitors/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Corre una vez por día (ver vercel.json): actualiza seguidores y publicaciones
// de las cuentas de competencia. Los errores quedan en cada cuenta (last_error)
// y se ven en la pantalla Espía.

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  return (request.headers.get("user-agent") || "").startsWith("vercel-cron");
}

export async function GET(request) {
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const results = await syncCompetitors(getSupabaseAdmin());
    return Response.json({ ok: true, results });
  } catch (err) {
    console.error("marketing-competitors cron error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
