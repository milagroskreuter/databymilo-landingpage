import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/marketing/sponsors/crud";
import { buildDealReport } from "@/lib/marketing/sponsors/report";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const report = await buildDealReport(getSupabaseAdmin(), params.id);
    if (!report) return Response.json({ error: "No existe" }, { status: 404 });
    return Response.json(report);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
