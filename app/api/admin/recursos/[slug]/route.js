import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("slug", params.slug)
      .single();

    if (error || !data) return Response.json({ error: "No encontrado" }, { status: 404 });

    return Response.json({
      ...data,
      desc: data.description,
      priceNote: data.price_note,
      paymentUrl: data.payment_url,
      forWho: data.for_who,
      isPaid: data.is_paid,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { isPaid, title, type, pages, desc, color, href, price, priceNote, paymentUrl, badge, forWho, note, bullets } = body;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("resources").update({
      title,
      is_paid: !!isPaid,
      type: type || "",
      pages: pages || "",
      description: desc || "",
      color: color || "#fadbe8",
      href: href || "",
      price: price || "",
      price_note: priceNote || "",
      payment_url: paymentUrl || "",
      badge: badge || "",
      for_who: forWho || "",
      note: note || "",
      bullets: bullets || [],
      updated_at: new Date().toISOString(),
    }).eq("slug", params.slug);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("resources").delete().eq("slug", params.slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
