import { json, fail, withSupabase, readJson } from "@/lib/marketing/community/admin";
import { cleanText, cleanNetwork, cleanTags, cleanDate } from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// GET ?filter=open|used|all → { items } (las sin usar y más repetidas primero)
export async function GET(request) {
  const filter = new URL(request.url).searchParams.get("filter") || "open";
  return withSupabase(async (supabase) => {
    let query = supabase
      .from("mk_community_questions")
      .select("*")
      .order("times", { ascending: false })
      .order("asked_on", { ascending: false })
      .limit(500);
    if (filter === "open") query = query.is("used_at", null);
    if (filter === "used") query = query.not("used_at", "is", null);
    const { data, error } = await query;
    if (error) throw error;
    return json({ items: data || [] });
  });
}

export async function POST(request) {
  const body = await readJson(request);
  const text = cleanText(body.text, 1000);
  if (!text) return fail("Escribí la pregunta");
  const times = Math.min(Math.max(parseInt(body.times, 10) || 1, 1), 9999);

  return withSupabase(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_community_questions")
      .insert({
        text,
        network: cleanNetwork(body.network),
        asked_on: cleanDate(body.asked_on) || new Date().toISOString().slice(0, 10),
        tags: cleanTags(body.tags),
        times,
        notes: cleanText(body.notes, 1000) || null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return json({ item: data }, 201);
  });
}
