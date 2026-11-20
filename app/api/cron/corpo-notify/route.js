import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyNewPost } from "@/lib/corpo";

export const dynamic = "force-dynamic";

// Corre una vez por día (ver vercel.json). Sirve para las notas programadas:
// cuando llega su fecha pasan a estar visibles solas, sin que nadie "publique",
// así que este cron las detecta y avisa a Edición Corpo.
// notifyNewPost es idempotente: nunca avisa dos veces la misma nota.

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  // Sin CRON_SECRET se acepta solo la llamada del cron de Vercel. El endpoint es
  // idempotente, así que lo peor que puede pasar es adelantar un aviso pendiente.
  return (request.headers.get("user-agent") || "").startsWith("vercel-cron");
}

export async function GET(request) {
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, cover_image, published, publish_at")
      .or(`published.eq.true,and(publish_at.not.is.null,publish_at.lte.${now})`);
    if (error) throw new Error(error.message);

    const { data: done } = await supabase.from("corpo_post_notifications").select("post_slug");
    const doneSet = new Set((done ?? []).map((d) => d.post_slug));

    const pending = (posts ?? []).filter((p) => !doneSet.has(p.slug));
    const results = [];
    for (const post of pending) {
      results.push({ slug: post.slug, ...(await notifyNewPost(post)) });
    }

    return Response.json({ ok: true, checked: posts?.length ?? 0, processed: results });
  } catch (err) {
    console.error("corpo-notify cron error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
