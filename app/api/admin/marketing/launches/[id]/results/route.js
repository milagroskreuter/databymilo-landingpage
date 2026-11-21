import { fail, json, withDb } from "@/lib/marketing/launches/launches";
import { launchResults } from "@/lib/marketing/launches/results";

export const dynamic = "force-dynamic";

// Ventas del recurso durante el lanzamiento vs. el período anterior de igual largo.
export async function GET(_, { params }) {
  return withDb(async (supabase) => {
    const { data: launch } = await supabase.from("mk_launches").select("*").eq("id", params.id).maybeSingle();
    if (!launch) return fail("No encontrado", 404);
    return json(await launchResults(supabase, launch));
  });
}
