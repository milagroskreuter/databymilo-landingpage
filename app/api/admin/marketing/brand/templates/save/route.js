import { getSupabaseAdmin } from "@/lib/supabase";
import { fail, getBrand, json, saveAsset } from "@/lib/marketing/brand/server";
import { DESIGN_BY_ID, SIZES } from "@/lib/marketing/brand/designs";
import { renderSlide } from "@/lib/marketing/brand/templates";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST { design, size, theme, data, page?, total?, name?, tags? } → genera el PNG y lo guarda en la biblioteca.
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    if (!DESIGN_BY_ID[b.design]) return fail("Diseño desconocido", 400);
    const size = SIZES.find((s) => s.id === b.size) || SIZES[0];
    const theme = b.theme === "claro" ? "claro" : "oscuro";
    const data = Object.fromEntries(Object.entries(b.data || {}).map(([k, v]) => [k, String(v ?? "").slice(0, 600)]));

    const supabase = getSupabaseAdmin();
    const { brand } = await getBrand(supabase);
    const img = await renderSlide({ brand, design: b.design, size: size.id, theme, data, page: b.page, total: b.total });
    const body = await img.arrayBuffer();

    const base = String(b.name || DESIGN_BY_ID[b.design].label).slice(0, 80);
    const name = b.page ? `${base} · ${b.page}${b.total ? ` de ${b.total}` : ""}.png` : `${base}.png`;
    const asset = await saveAsset(supabase, {
      folder: "plantillas",
      name,
      body,
      mime: "image/png",
      width: size.width,
      height: size.height,
      tags: ["plantilla", b.design, ...(Array.isArray(b.tags) ? b.tags : [])],
      source: "template",
      meta: { design: b.design, size: size.id, theme, data, page: b.page || null, total: b.total || null },
    });
    return json({ asset }, 201);
  } catch (err) {
    return fail(err);
  }
}
