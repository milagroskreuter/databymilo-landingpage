import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyNewPost } from "@/lib/corpo";

export const dynamic = "force-dynamic";

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function logActivity(supabase, action, entityType, entityId, entityTitle, metadata = {}) {
  try {
    await supabase.from("activity_log").insert({ action, entity_type: entityType, entity_id: entityId, entity_title: entityTitle, metadata });
  } catch {}
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, date, excerpt, tags, cover_image, published, publish_at, created_at, updated_at")
      .order("date", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ posts: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Duplicate endpoint
    if (body.duplicate_slug) {
      const supabase = getSupabaseAdmin();
      const { data: src } = await supabase.from("blog_posts").select("*").eq("slug", body.duplicate_slug).single();
      if (!src) return Response.json({ error: "Post no encontrado" }, { status: 404 });
      const newSlug = slugify(src.title + "-copia");
      const { data, error } = await supabase.from("blog_posts").insert({
        slug: newSlug, title: src.title + " (copia)", date: new Date().toISOString().slice(0, 10),
        excerpt: src.excerpt, tags: src.tags, content: src.content,
        cover_image: src.cover_image, published: false, publish_at: null, word_count: src.word_count || 0,
      }).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      await logActivity(supabase, "duplicate", "post", newSlug, data.title);
      return Response.json({ post: data }, { status: 201 });
    }

    const { title, date, excerpt, tags, cover_image, content, published, publish_at } = body;

    if (!title) return Response.json({ error: "Falta el título" }, { status: 400 });

    const slug = slugify(title);
    const supabase = getSupabaseAdmin();

    // If scheduling, use publish_at date as the display date
    const isScheduled = publish_at && new Date(publish_at) > new Date();
    const resolvedDate = isScheduled
      ? new Date(publish_at).toISOString().slice(0, 10)
      : (date || new Date().toISOString().slice(0, 10));

    const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title,
        date: resolvedDate,
        excerpt: excerpt || "",
        tags: tags || [],
        cover_image: cover_image || "",
        content: content || "",
        published: isScheduled ? false : (published !== false),
        publish_at: publish_at || null,
        word_count: wordCount,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Ya existe un post con ese título (slug duplicado)" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    const action = isScheduled ? "schedule" : (published !== false ? "publish" : "draft");
    await logActivity(supabase, action, "post", slug, title);

    // Nota publicada ahora → aviso a Edición Corpo (idempotente, nunca lanza).
    // Las programadas las avisa el cron cuando llega su fecha.
    if (data.published) await notifyNewPost(data);

    return Response.json({ post: data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
