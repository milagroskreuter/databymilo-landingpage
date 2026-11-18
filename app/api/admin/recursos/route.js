import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const free = (data || []).filter((r) => !r.is_paid);
    const paid = (data || []).filter((r) => r.is_paid);
    return Response.json({ free, paid, total: data.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { slug, isPaid, title, type, pages, desc, color, href, price, priceNote, paymentUrl, badge, forWho, note, bullets } = body;

    if (!slug || !title) return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Get max sort_order
    const { data: last } = await supabase.from("resources").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
    const sortOrder = (last?.sort_order || 0) + 1;

    const { data, error } = await supabase.from("resources").insert({
      slug, title,
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
      sort_order: sortOrder,
    }).select().single();

    if (error) {
      if (error.code === "23505") return Response.json({ error: "Ya existe un recurso con ese slug" }, { status: 409 });
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, slug: data.slug }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
