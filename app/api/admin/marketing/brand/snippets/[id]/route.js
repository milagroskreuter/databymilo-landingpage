import { getSupabaseAdmin } from "@/lib/supabase";
import { cleanTags, fail, json } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

// PATCH { kind?, title?, body?, network?, tags? } o { copied: true } para sumar un uso.
export async function PATCH(request, { params }) {
  try {
    const b = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    if (b.copied) {
      const { data: cur } = await supabase.from("mk_brand_snippets").select("uses").eq("id", params.id).single();
      await supabase.from("mk_brand_snippets").update({ uses: (cur?.uses || 0) + 1 }).eq("id", params.id);
      return json({ ok: true });
    }

    const patch = { updated_at: new Date().toISOString() };
    if (b.kind) patch.kind = b.kind;
    if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim().slice(0, 160);
    if (typeof b.body === "string" && b.body.trim()) patch.body = b.body.trim();
    if (b.network !== undefined) patch.network = b.network || null;
    if (b.tags !== undefined) patch.tags = cleanTags(b.tags);
    const { data, error } = await supabase.from("mk_brand_snippets").update(patch).eq("id", params.id).select().single();
    if (error) return fail(error);
    return json({ snippet: data });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("mk_brand_snippets").delete().eq("id", params.id);
    if (error) return fail(error);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
