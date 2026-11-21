import { json, fail, withSupabase, withScreenshotUrls } from "@/lib/marketing/community/admin";
import {
  PRIVATE_BUCKET,
  cleanLine,
  cleanText,
  cleanUrl,
  cleanNetwork,
  cleanDate,
  uploadImage,
  removeFiles,
} from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// GET ?filter=pending|shared|all → { items } con links firmados a las capturas.
export async function GET(request) {
  const filter = new URL(request.url).searchParams.get("filter") || "all";
  return withSupabase(async (supabase) => {
    let query = supabase
      .from("mk_community_mentions")
      .select("*")
      .order("shared", { ascending: true })
      .order("mentioned_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);
    if (filter === "pending") query = query.eq("shared", false);
    if (filter === "shared") query = query.eq("shared", true);
    const { data, error } = await query;
    if (error) throw error;
    return json({ items: await withScreenshotUrls(supabase, data || []) });
  });
}

// POST (multipart): link, red, autor, nota, fecha y captura opcional.
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("Bad request");
  }
  const rawUrl = form.get("url") ?? "";
  const url = cleanUrl(rawUrl);
  if (cleanLine(rawUrl) && !url) return fail("El link no parece válido");
  const author = cleanLine(form.get("author") ?? "", 120);
  const note = cleanText(form.get("note") ?? "", 1500);
  const photo = form.get("screenshot");
  const hasFile = photo && typeof photo.arrayBuffer === "function" && photo.size > 0;
  if (!url && !author && !note && !hasFile) return fail("Cargá al menos un link, autor, nota o captura");

  return withSupabase(async (supabase) => {
    let path = null;
    try {
      path = await uploadImage(supabase, photo, {
        bucket: PRIVATE_BUCKET,
        folder: "mentions",
        maxBytes: 4 * 1024 * 1024, // Vercel corta los pedidos de más de ~4,5 MB
        allowGif: true,
      });
    } catch (err) {
      return fail(err.message);
    }
    const { data, error } = await supabase
      .from("mk_community_mentions")
      .insert({
        url: url || null,
        network: cleanNetwork(form.get("network")),
        author: author || null,
        note: note || null,
        mentioned_on: cleanDate(form.get("mentioned_on")) || new Date().toISOString().slice(0, 10),
        screenshot_path: path,
      })
      .select("*")
      .single();
    if (error) {
      await removeFiles(supabase, PRIVATE_BUCKET, [path]);
      throw error;
    }
    const [item] = await withScreenshotUrls(supabase, [data]);
    return json({ item }, 201);
  });
}
