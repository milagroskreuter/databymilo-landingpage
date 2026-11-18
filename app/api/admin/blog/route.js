import { getSupabaseAdmin } from "@/lib/supabase";

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
    const { title, date, excerpt, tags, cover_image, content, published, publish_at } = body;

    if (!title) return Response.json({ error: "Falta el título" }, { status: 400 });

    const slug = slugify(title);
    const supabase = getSupabaseAdmin();

    // If scheduling, use publish_at date as the display date
    const isScheduled = publish_at && new Date(publish_at) > new Date();
    const resolvedDate = isScheduled
      ? new Date(publish_at).toISOString().slice(0, 10)
      : (date || new Date().toISOString().slice(0, 10));

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
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Ya existe un post con ese título (slug duplicado)" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ post: data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
