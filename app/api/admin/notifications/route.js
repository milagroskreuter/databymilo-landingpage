import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET    ?limit=30&type=subscribe&unread=1  → lista + cantidad de no leídas
// PATCH  { ids: [...] } | { all: true }     → marcar como leídas
// DELETE { id } | { allRead: true }         → borrar una o todas las leídas

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10) || 30, 200);
    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unread") === "1";

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (type) query = query.eq("type", type);
    if (unreadOnly) query = query.eq("read", false);

    const [list, unread] = await Promise.all([
      query,
      supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false),
    ]);

    if (list.error) return Response.json({ error: list.error.message }, { status: 500 });
    return Response.json({
      notifications: list.data ?? [],
      unread: unread.count ?? 0,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    let query = supabase.from("admin_notifications").update({ read: true });
    if (body.all) {
      query = query.eq("read", false);
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      query = query.in("id", body.ids);
    } else {
      return Response.json({ error: "Falta ids o all" }, { status: 400 });
    }

    const { error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    let query = supabase.from("admin_notifications").delete();
    if (body.allRead) {
      query = query.eq("read", true);
    } else if (body.id) {
      query = query.eq("id", body.id);
    } else {
      return Response.json({ error: "Falta id o allRead" }, { status: 400 });
    }

    const { error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
