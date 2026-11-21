import { fail, json } from "@/lib/marketing/brand/server";
import { canvaFetch } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";

// GET ?q= → plantillas de marca (brand templates) de Canva.
// GET ?id= → campos de autofill (dataset) de una plantilla.
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const id = sp.get("id");
    if (id) {
      if (!/^[A-Za-z0-9_-]+$/.test(id)) return fail("Plantilla inválida", 400);
      const data = await canvaFetch(`/brand-templates/${id}/dataset`);
      const fields = Object.entries(data.dataset || {}).map(([name, def]) => ({ name, type: def?.type || "text" }));
      return json({ fields });
    }
    const qs = new URLSearchParams({ limit: "50" });
    const q = (sp.get("q") || "").trim().slice(0, 255);
    if (q) qs.set("query", q);
    const data = await canvaFetch(`/brand-templates?${qs}`);
    const templates = (data.items || []).map((t) => ({
      id: t.id,
      title: t.title || "Sin título",
      thumbnail: t.thumbnail?.url || null,
      viewUrl: t.view_url || null,
      createUrl: t.create_url || null,
    }));
    return json({ templates });
  } catch (err) {
    // 403: la cuenta no tiene plantillas de marca o falta un permiso de la integración.
    if (err.status === 403) {
      return json({
        templates: [],
        unavailable: true,
        message:
          "Canva no deja usar plantillas de marca con esta cuenta o integración. Revisá que tengas Canva Pro (o Teams) y que la integración tenga los permisos brandtemplate:meta:read y brandtemplate:content:read.",
      });
    }
    return fail(err, err.status || 500);
  }
}
