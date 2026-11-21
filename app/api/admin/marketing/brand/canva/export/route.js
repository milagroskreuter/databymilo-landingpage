import { getSupabaseAdmin } from "@/lib/supabase";
import { fail, json, saveAsset } from "@/lib/marketing/brand/server";
import { canvaFetch, waitJob } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { designId, title?, tags? } → exporta el diseño como PNG (una imagen por página)
// y guarda cada página en la biblioteca.
export async function POST(request) {
  try {
    const { designId, title, tags } = await request.json().catch(() => ({}));
    if (!designId || !/^[A-Za-z0-9_-]+$/.test(designId)) return fail("Falta el diseño", 400);

    const { job } = await canvaFetch("/exports", {
      method: "POST",
      body: JSON.stringify({ design_id: designId, format: { type: "png", lossless: true } }),
    });
    const done = job.status === "success" ? job : await waitJob(`/exports/${job.id}`, { timeoutMs: 45_000 });
    const urls = done.urls || [];
    if (!urls.length) return fail("Canva no devolvió imágenes", 502);

    const supabase = getSupabaseAdmin();
    const base = String(title || "Diseño de Canva").slice(0, 80);
    const assets = [];
    for (let i = 0; i < urls.length && i < 20; i++) {
      const res = await fetch(urls[i], { cache: "no-store" });
      if (!res.ok) continue;
      const body = await res.arrayBuffer();
      assets.push(
        await saveAsset(supabase, {
          folder: "canva",
          name: urls.length > 1 ? `${base} · ${i + 1} de ${urls.length}.png` : `${base}.png`,
          body,
          mime: "image/png",
          tags: ["canva", ...(Array.isArray(tags) ? tags : [])],
          source: "canva",
          meta: { canva_design_id: designId, page: i + 1, pages: urls.length },
        })
      );
    }
    return json({ assets }, 201);
  } catch (err) {
    return fail(err, err.status || 500);
  }
}
