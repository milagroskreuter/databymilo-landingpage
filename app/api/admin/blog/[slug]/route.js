import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyNewPost } from "@/lib/corpo";

export const dynamic = "force-dynamic";

async function logActivity(supabase, action, entityType, entityId, entityTitle) {
  try { await supabase.from("activity_log").insert({ action, entity_type: entityType, entity_id: entityId, entity_title: entityTitle }); } catch {}
}

async function saveVersion(supabase, slug, post) {
  try {
    await supabase.from("post_versions").insert({
      post_slug: slug, title: post.title, content: post.content,
      excerpt: post.excerpt, tags: post.tags, published: post.published,
    });
    // Keep only last 15 versions per post
    const { data: versions } = await supabase.from("post_versions").select("id").eq("post_slug", slug).order("created_at", { ascending: false });
    if (versions && versions.length > 15) {
      const toDelete = versions.slice(15).map(v => v.id);
      await supabase.from("post_versions").delete().in("id", toDelete);
    }
  } catch {}
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .single();

    if (error || !data) return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ post: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { title, date, excerpt, tags, cover_image, content, published, publish_at } = body;

    const isScheduled = publish_at && new Date(publish_at) > new Date();
    const resolvedDate = isScheduled
      ? new Date(publish_at).toISOString().slice(0, 10)
      : date;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title,
        date: resolvedDate,
        excerpt,
        tags,
        cover_image,
        content,
        published: isScheduled ? false : published,
        publish_at: publish_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", params.slug)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "No encontrado" }, { status: 404 });

    await saveVersion(supabase, params.slug, { title, content, excerpt, tags, published: isScheduled ? false : published });
    const action = isScheduled ? "schedule" : (published ? "publish" : "draft");
    await logActivity(supabase, action, "post", params.slug, title);

    // Si la nota quedó publicada y todavía no se avisó, avisar a Edición Corpo.
    // Editar una nota ya avisada no vuelve a mandar nada.
    if (data.published) await notifyNewPost(data);

    return Response.json({ post: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("blog_posts").select("title").eq("slug", params.slug).single();
    const { error } = await supabase.from("blog_posts").delete().eq("slug", params.slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await logActivity(supabase, "delete", "post", params.slug, existing?.title || params.slug);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
