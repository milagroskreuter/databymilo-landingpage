import { json, fail, withSupabase, readJson, isUuid } from "@/lib/marketing/community/admin";

export const dynamic = "force-dynamic";

// PATCH { starred }: marca o desmarca la publicación como inspiración.
export async function PATCH(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);
  if (!("starred" in body)) return fail("Nada para cambiar");
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_competitor_posts")
      .update({ starred: Boolean(body.starred), updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("id, starred")
      .single();
    if (error) throw error;
    return json({ item: data });
  });
}
