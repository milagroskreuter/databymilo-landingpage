import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function POST(request, { params }) {
  const slug = params.slug;
  if (typeof slug !== "string" || slug.length > 80 || !SLUG_RE.test(slug)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Una descarga por recurso cada 10 minutos por IP: evita que un script infle el contador.
  const { ok } = rateLimit(`download:${slug}:${getIp(request)}`, { max: 1, windowMs: 10 * 60_000 });
  if (!ok) return Response.json({ ok: true });

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("resources").select("download_count").eq("slug", slug).maybeSingle();
    if (!data) return Response.json({ ok: false }, { status: 404 });
    await supabase
      .from("resources")
      .update({ download_count: (data.download_count || 0) + 1 })
      .eq("slug", slug);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
