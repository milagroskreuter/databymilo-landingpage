import { getSupabaseAdmin } from "@/lib/supabase";
import { cleanLink } from "@/lib/marketing/links/validate";
import { revalidateLinks } from "@/lib/marketing/links/data";
import { shortUrl } from "@/lib/marketing/links/shared";
import { jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

// GET: todos los links con sus clicks. POST: crear un link.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [links, totals] = await Promise.all([
      supabase
        .from("mk_links_links")
        .select("*")
        .order("in_bio", { ascending: false })
        .order("bio_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("mk_links_click_totals").select("*"),
    ]);
    if (links.error) throw new Error(links.error.message);
    const byId = Object.fromEntries((totals.data ?? []).map((t) => [t.link_id, t]));
    return Response.json({
      links: (links.data ?? []).map((l) => ({
        ...l,
        short_url: shortUrl(l.slug),
        clicks_total: byId[l.id]?.total ?? 0,
        clicks_30d: byId[l.id]?.last_30d ?? 0,
        last_click: byId[l.id]?.last_click ?? null,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { row, error } = cleanLink(body);
    if (error) return Response.json({ error }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (row.in_bio) {
      const { data: last } = await supabase
        .from("mk_links_links")
        .select("bio_order")
        .eq("in_bio", true)
        .order("bio_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      row.bio_order = (last?.bio_order ?? 0) + 1;
    }

    const { data, error: dbError } = await supabase.from("mk_links_links").insert(row).select().single();
    if (dbError) {
      if (dbError.code === "23505") return Response.json({ error: "Ya existe un link con ese nombre corto" }, { status: 409 });
      throw new Error(dbError.message);
    }
    revalidateLinks();
    return Response.json({ link: { ...data, short_url: shortUrl(data.slug) } }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
