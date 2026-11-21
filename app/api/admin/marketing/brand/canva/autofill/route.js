import { fail, json } from "@/lib/marketing/brand/server";
import { canvaFetch, waitJob } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { templateId, title?, data: { campo: "texto" } } → crea un diseño nuevo en Canva
// desde una plantilla de marca con los textos dados (solo campos de texto).
export async function POST(request) {
  try {
    const { templateId, title, data } = await request.json().catch(() => ({}));
    if (!templateId || !/^[A-Za-z0-9_-]+$/.test(templateId)) return fail("Falta la plantilla", 400);
    const fields = Object.fromEntries(
      Object.entries(data || {})
        .filter(([, v]) => String(v ?? "").trim())
        .map(([k, v]) => [k, { type: "text", text: String(v).slice(0, 2000) }])
    );
    if (!Object.keys(fields).length) return fail("Completá al menos un campo", 400);

    const { job } = await canvaFetch("/autofills", {
      method: "POST",
      body: JSON.stringify({
        brand_template_id: templateId,
        ...(title ? { title: String(title).slice(0, 255) } : {}),
        data: fields,
      }),
    });
    const done = job.status === "success" ? job : await waitJob(`/autofills/${job.id}`, { timeoutMs: 45_000 });
    const d = done.result?.design || {};
    return json({
      design: {
        id: d.id || null,
        title: d.title || title || "Diseño nuevo",
        url: d.urls?.edit_url || d.url || null,
        thumbnail: d.thumbnail?.url || null,
      },
    });
  } catch (err) {
    if (err.status === 403) {
      return fail("Canva no permitió el autofill con esta cuenta. Necesitás Canva Pro, Teams o Enterprise y el permiso design:content:write.", 403);
    }
    return fail(err, err.status || 500);
  }
}
