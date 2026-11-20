import { getSupabaseAdmin } from "@/lib/supabase";
import { loadOverview } from "@/lib/marketing/metrics/overview";

export const dynamic = "force-dynamic";

// Datos de la pantalla de Métricas de redes (estado de cada red, seguidores,
// metas, publicaciones con su pieza de contenido y avisos abiertos).
export async function GET(request) {
  try {
    const data = await loadOverview(getSupabaseAdmin(), request);
    return Response.json(data);
  } catch (err) {
    console.error("metrics overview:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
