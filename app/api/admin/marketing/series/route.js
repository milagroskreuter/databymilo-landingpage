import { getSupabaseAdmin } from "@/lib/supabase";
import { SERIES_TABLE, validateSeries } from "@/lib/marketing/content/series";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin().from(SERIES_TABLE).select("*").order("created_at");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ items: data || [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error } = validateSeries(body);
    if (error) return Response.json({ error }, { status: 400 });
    const res = await getSupabaseAdmin().from(SERIES_TABLE).insert(data).select().single();
    if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
    return Response.json({ item: res.data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
