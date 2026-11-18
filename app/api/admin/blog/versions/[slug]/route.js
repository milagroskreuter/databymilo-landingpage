import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("post_versions")
    .select("id, post_slug, title, excerpt, tags, published, created_at")
    .eq("post_slug", params.slug)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ versions: data });
}

// Restore a specific version
export async function POST(request, { params }) {
  const { version_id } = await request.json().catch(() => ({}));
  if (!version_id) return Response.json({ error: "Falta version_id" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: version, error: vErr } = await supabase
    .from("post_versions")
    .select("*")
    .eq("id", version_id)
    .single();

  if (vErr || !version) return Response.json({ error: "Versión no encontrada" }, { status: 404 });

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      title: version.title, content: version.content, excerpt: version.excerpt,
      tags: version.tags, updated_at: new Date().toISOString(),
    })
    .eq("slug", params.slug)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  try {
    await supabase.from("activity_log").insert({ action: "restore", entity_type: "post", entity_id: params.slug, entity_title: version.title, metadata: { version_id, restored_at: new Date().toISOString() } });
  } catch {}

  return Response.json({ post: data });
}
