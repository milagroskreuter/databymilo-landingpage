import { json, fail, withSupabase, readJson, isUuid } from "@/lib/marketing/community/admin";
import { syncCompetitors } from "@/lib/marketing/competitors/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { id? }: "Actualizar ahora" de una cuenta o de todas.
export async function POST(request) {
  const body = await readJson(request);
  if (body.id && !isUuid(body.id)) return fail("Id inválido");
  return withSupabase(async (supabase) => {
    const results = await syncCompetitors(supabase, { ids: body.id ? [body.id] : undefined });
    return json({ results });
  });
}
