import { getSupabaseAdmin } from "@/lib/supabase";
import { ASSET_BUCKET, cleanTags, fail, json, withSignedUrls } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

// PATCH { name?, tags? }
export async function PATCH(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const patch = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 200);
    if (body.tags !== undefined) patch.tags = cleanTags(body.tags);
    if (!Object.keys(patch).length) return fail("Nada para actualizar", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("mk_brand_assets").update(patch).eq("id", params.id).select().single();
    if (error) return fail(error);
    const [row] = await withSignedUrls(supabase, [data]);
    return json({ asset: row });
  } catch (err) {
    return fail(err);
  }
}

// DELETE → borra el archivo del bucket y de la biblioteca.
export async function DELETE(_request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("mk_brand_assets").select("path").eq("id", params.id).single();
    if (error || !row) return fail("No encontré el archivo", 404);
    const { error: rmErr } = await supabase.storage.from(ASSET_BUCKET).remove([row.path]);
    if (rmErr) return fail(rmErr);
    const { error: delErr } = await supabase.from("mk_brand_assets").delete().eq("id", params.id);
    if (delErr) return fail(delErr);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
