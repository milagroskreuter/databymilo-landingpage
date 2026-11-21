import { json, fail, withSupabase, readJson } from "@/lib/marketing/community/admin";
import { cleanUsername, syncCompetitors } from "@/lib/marketing/competitors/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET: cuentas seguidas, su historia de seguidores y sus publicaciones.
export async function GET() {
  return withSupabase(async (supabase) => {
    const [competitors, posts, snapshots] = await Promise.all([
      supabase.from("mk_competitors").select("*").order("created_at"),
      supabase
        .from("mk_competitor_posts")
        .select("id, competitor_id, external_id, permalink, caption, format, posted_at, likes, comments, views, starred, content_id, first_seen_at, updated_at")
        .order("posted_at", { ascending: false })
        .limit(3000),
      supabase.from("mk_competitor_snapshots").select("*").order("day"),
    ]);
    for (const r of [competitors, posts, snapshots]) if (r.error) throw r.error;
    return json({ competitors: competitors.data, posts: posts.data, snapshots: snapshots.data });
  });
}

// POST { username, notes? }: agrega una cuenta de Instagram y la lee en el momento.
export async function POST(request) {
  const body = await readJson(request);
  const username = cleanUsername(body.username);
  if (!username) return fail("Escribí el @usuario de la cuenta");

  return withSupabase(async (supabase) => {
    const { data: existing } = await supabase
      .from("mk_competitors")
      .select("id")
      .eq("network", "instagram")
      .eq("username", username)
      .maybeSingle();
    if (existing) return fail(`Ya seguís a @${username}`, 409);

    const { data: item, error } = await supabase
      .from("mk_competitors")
      .insert({ network: "instagram", username, notes: body.notes ? String(body.notes).slice(0, 2000) : null })
      .select("*")
      .single();
    if (error) throw error;

    let result = null;
    try {
      [result] = await syncCompetitors(supabase, { ids: [item.id] });
    } catch (err) {
      result = { ok: false, error: err.message };
    }
    return json({ item, result }, 201);
  });
}
