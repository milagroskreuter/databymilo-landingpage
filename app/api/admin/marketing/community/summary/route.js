import { json, withSupabase } from "@/lib/marketing/community/admin";

export const dynamic = "force-dynamic";

// Contadores para las pestañas de Comunidad.
export async function GET() {
  return withSupabase(async (supabase) => {
    const head = { count: "exact", head: true };
    const [pending, unused, unshared] = await Promise.all([
      supabase.from("mk_community_testimonials").select("id", head).eq("status", "pending"),
      supabase.from("mk_community_questions").select("id", head).is("used_at", null),
      supabase.from("mk_community_mentions").select("id", head).eq("shared", false),
    ]);
    const err = pending.error || unused.error || unshared.error;
    if (err) throw err;
    return json({
      pendingTestimonials: pending.count ?? 0,
      unusedQuestions: unused.count ?? 0,
      unsharedMentions: unshared.count ?? 0,
    });
  });
}
