import { json, fail, withSupabase, readJson, isUuid, withScreenshotUrls } from "@/lib/marketing/community/admin";
import {
  PRIVATE_BUCKET,
  cleanLine,
  cleanText,
  cleanUrl,
  cleanNetwork,
  cleanDate,
  removeFiles,
} from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// PATCH: { shared: true|false } y edición de campos.
export async function PATCH(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);

  const patch = {};
  if (body.shared !== undefined) {
    patch.shared = !!body.shared;
    patch.shared_at = body.shared ? new Date().toISOString() : null;
  }
  if (body.url !== undefined) {
    const url = cleanUrl(body.url);
    if (cleanLine(body.url) && !url) return fail("El link no parece válido");
    patch.url = url || null;
  }
  if (body.network !== undefined) patch.network = cleanNetwork(body.network);
  if (body.author !== undefined) patch.author = cleanLine(body.author, 120) || null;
  if (body.note !== undefined) patch.note = cleanText(body.note, 1500) || null;
  if (body.mentioned_on !== undefined) {
    const d = cleanDate(body.mentioned_on);
    if (!d) return fail("Fecha inválida");
    patch.mentioned_on = d;
  }
  if (!Object.keys(patch).length) return fail("Nada para cambiar");
  patch.updated_at = new Date().toISOString();

  return withSupabase(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_community_mentions")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("No existe", 404);
    const [item] = await withScreenshotUrls(supabase, [data]);
    return json({ item });
  });
}

export async function DELETE(_request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_community_mentions")
      .delete()
      .eq("id", params.id)
      .select("screenshot_path")
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("No existe", 404);
    await removeFiles(supabase, PRIVATE_BUCKET, [data.screenshot_path]);
    return json({ ok: true });
  });
}
