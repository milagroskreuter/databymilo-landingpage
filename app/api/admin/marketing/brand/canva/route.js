import { fail, json } from "@/lib/marketing/brand/server";
import { canvaFetch, canvaStatus, disconnect, redirectUri } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";

// GET → estado de la conexión; con ?designs=1&q=&continuation= también lista diseños.
export async function GET(request) {
  try {
    const status = await canvaStatus();
    const out = { ...status, redirectUri: redirectUri(request) };
    const sp = new URL(request.url).searchParams;
    if (sp.get("designs") && status.connected) {
      const qs = new URLSearchParams({ limit: "30", sort_by: "modified_descending" });
      const q = (sp.get("q") || "").trim().slice(0, 255);
      if (q) {
        qs.set("query", q);
        qs.delete("sort_by");
      }
      if (sp.get("continuation")) qs.set("continuation", sp.get("continuation"));
      const data = await canvaFetch(`/designs?${qs}`);
      out.designs = (data.items || []).map((d) => ({
        id: d.id,
        title: d.title || "Sin título",
        thumbnail: d.thumbnail?.url || null,
        editUrl: d.urls?.edit_url || null,
        viewUrl: d.urls?.view_url || null,
        updatedAt: d.updated_at ? new Date(d.updated_at * 1000).toISOString() : null,
        pages: d.page_count || null,
      }));
      out.continuation = data.continuation || null;
    }
    return json(out);
  } catch (err) {
    return fail(err, err.status || 500);
  }
}

// DELETE → desconecta Canva (borra los tokens guardados).
export async function DELETE() {
  try {
    await disconnect();
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
