import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
    const { title, date, excerpt, tags, cover_image, content, published } = body;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title,
        date,
        excerpt,
        tags,
        cover_image,
        content,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", params.slug)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ post: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("slug", params.slug);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
