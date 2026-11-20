import { getSupabaseAdmin } from "@/lib/supabase";
import { PILLARS_TABLE, validatePillar } from "@/lib/marketing/content/pillars";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(PILLARS_TABLE)
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ items: data || [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error } = validatePillar(body);
    if (error) return Response.json({ error }, { status: 400 });
    const supabase = getSupabaseAdmin();
    if (data.sort_order == null) {
      const { data: last } = await supabase
        .from(PILLARS_TABLE)
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      data.sort_order = (last?.sort_order || 0) + 1;
    }
    const res = await supabase.from(PILLARS_TABLE).insert(data).select().single();
    if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
    return Response.json({ item: res.data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
