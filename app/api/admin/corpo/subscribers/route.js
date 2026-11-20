import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("corpo_subscribers")
      .select("email, first_name, subscribed, created_at, unsubscribed_at")
      .order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const subscribers = data ?? [];
    return Response.json({
      subscribers,
      total: subscribers.length,
      active: subscribers.filter((s) => s.subscribed).length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { email } = await request.json().catch(() => ({}));
    if (!email) return Response.json({ error: "Falta email" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("corpo_subscribers").delete().eq("email", email);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
