import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSeriesPieces } from "@/lib/marketing/content/series";

export const dynamic = "force-dynamic";

// POST { weeks } → crea las piezas de las próximas N semanas (sin duplicar fechas).
export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error, status } = await generateSeriesPieces(getSupabaseAdmin(), params.id, { weeks: body.weeks });
    if (error) return Response.json({ error }, { status });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
