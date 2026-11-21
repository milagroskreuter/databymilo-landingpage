import { getBrand } from "@/lib/marketing/brand/server";
import { withDefaults } from "@/lib/marketing/brand/defaults";
import { parseRenderParams, renderSlide } from "@/lib/marketing/brand/templates";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET ?design=&size=&theme=&page=&total=&f_<campo>=...&download=1 → PNG de una placa.
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const params = parseRenderParams(sp);

  // Si la base no responde, se usa la marca por defecto para no cortar la vista previa.
  let brand;
  try {
    brand = (await getBrand()).brand;
  } catch {
    brand = withDefaults({});
  }

  const img = await renderSlide({ brand, ...params });
  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "private, no-store");
  if (sp.get("download")) {
    const name = (sp.get("name") || `${params.design}-${params.page || 1}`).replace(/[^a-z0-9-_]/gi, "-");
    headers.set("Content-Disposition", `attachment; filename="${name}.png"`);
  }
  return new Response(img.body, { status: 200, headers });
}
