import { getSupabaseAdmin } from "@/lib/supabase";
import { jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

// Opciones para los selectores del formulario: recursos, listas y publicaciones.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [resources, lists, content] = await Promise.all([
      supabase.from("resources").select("slug, title, is_paid, href, payment_url").order("sort_order", { ascending: true }),
      supabase.from("mail_lists").select("slug, name, active, source").order("sort_order", { ascending: true }),
      supabase
        .from("mk_content")
        .select("id, title, network, status, scheduled_at, published_at")
        .neq("status", "descartado")
        .neq("status", "idea")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);
    return Response.json({
      resources: resources.data ?? [],
      // "compradoras" se llena sola con las compras: no tiene página para sumarse.
      lists: (lists.data ?? []).filter((l) => l.slug !== "compradoras"),
      content: content.data ?? [],
    });
  } catch (err) {
    return jsonError(err);
  }
}
