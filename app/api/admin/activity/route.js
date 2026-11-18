import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const type = searchParams.get("type");

  const supabase = getSupabaseAdmin();
  let query = supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (type) query = query.eq("entity_type", type);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ log: data });
}
