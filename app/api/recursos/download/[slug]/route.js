import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("resources").select("download_count").eq("slug", params.slug).single();
    await supabase.from("resources").update({ download_count: (data?.download_count || 0) + 1 }).eq("slug", params.slug);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
