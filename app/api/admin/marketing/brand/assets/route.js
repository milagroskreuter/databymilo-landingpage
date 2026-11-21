import { getSupabaseAdmin } from "@/lib/supabase";
import { ASSET_BUCKET, cleanTags, fail, json, withSignedUrls } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

// GET ?q=&tag=&source=&type=image&ids=a,b&limit= → archivos de la biblioteca con URL firmada.
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("mk_brand_assets").select("*").order("created_at", { ascending: false });

    const ids = (sp.get("ids") || "").split(",").filter(Boolean);
    if (ids.length) query = query.in("id", ids);
    const q = (sp.get("q") || "").trim().replace(/[%,(){}"\\]/g, " ").trim();
    if (q) query = query.or(`name.ilike.%${q}%,tags.cs.{${q.toLowerCase()}}`);
    const tag = (sp.get("tag") || "").trim().toLowerCase();
    if (tag) query = query.contains("tags", [tag]);
    const source = sp.get("source");
    if (source) query = query.eq("source", source);
    if (sp.get("type") === "image") query = query.like("mime", "image/%");
    query = query.limit(Math.min(Number(sp.get("limit")) || 120, 300));

    const { data, error } = await query;
    if (error) return fail(error);

    // Todas las etiquetas usadas (para los filtros).
    const { data: tagRows } = await supabase.from("mk_brand_assets").select("tags").limit(2000);
    const counts = {};
    for (const r of tagRows || []) for (const t of r.tags || []) counts[t] = (counts[t] || 0) + 1;
    const tags = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return json({ assets: await withSignedUrls(supabase, data), tags });
  } catch (err) {
    return fail(err);
  }
}

// POST { path, name, mime, size, width, height, tags } → registra un archivo ya subido
// con la URL firmada de subida (ver ./upload-url).
export async function POST(request) {
  try {
    const { path, name, mime, size, width, height, tags, meta } = await request.json().catch(() => ({}));
    if (!path || !path.startsWith("uploads/") || path.includes("..")) return fail("Ruta inválida", 400);
    const supabase = getSupabaseAdmin();

    // Confirma que el archivo existe en el bucket antes de registrarlo.
    const folder = path.split("/").slice(0, -1).join("/");
    const file = path.split("/").pop();
    const { data: found } = await supabase.storage.from(ASSET_BUCKET).list(folder, { search: file, limit: 1 });
    if (!found?.length) return fail("No encontré el archivo subido", 400);

    const { data, error } = await supabase
      .from("mk_brand_assets")
      .insert({
        path,
        name: String(name || file).slice(0, 200),
        mime: mime || found[0]?.metadata?.mimetype || null,
        size_bytes: size || found[0]?.metadata?.size || null,
        width: width || null,
        height: height || null,
        tags: cleanTags(tags),
        source: "upload",
        meta: meta && typeof meta === "object" ? meta : {},
      })
      .select()
      .single();
    if (error) return fail(error);
    const [row] = await withSignedUrls(supabase, [data]);
    return json({ asset: row }, 201);
  } catch (err) {
    return fail(err);
  }
}
