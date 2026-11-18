import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

async function getLocalTags(supabase, emails) {
  if (!emails.length) return {};
  const { data } = await supabase.from("contact_tags").select("email, tags, notes").in("email", emails);
  const map = {};
  (data || []).forEach(r => { map[r.email] = { tags: r.tags || [], notes: r.notes || "" }; });
  return map;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tagFilter = searchParams.get("tag");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const contacts = (data?.data ?? []);
  const supabase = getSupabaseAdmin();
  const localTags = await getLocalTags(supabase, contacts.map(c => c.email));

  const enriched = contacts.map(c => ({
    ...c,
    tags: localTags[c.email]?.tags || [],
    notes: localTags[c.email]?.notes || "",
  }));

  const filtered = tagFilter ? enriched.filter(c => c.tags.includes(tagFilter)) : enriched;
  const active = filtered.filter(c => !c.unsubscribed);

  return Response.json({ data: filtered, total: filtered.length, active: active.length });
}

export async function POST(request) {
  const { email, firstName, lastName } = await request.json().catch(() => ({}));
  if (!email) return Response.json({ error: "Falta email" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.contacts.create({
    audienceId: AUDIENCE_ID, email,
    firstName: firstName || "", lastName: lastName || "", unsubscribed: false,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data?.id });
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));

  // Update local tags/notes
  if (body.updateTags !== undefined || body.notes !== undefined) {
    const { email, tags, notes } = body;
    if (!email) return Response.json({ error: "Falta email" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    await supabase.from("contact_tags").upsert({ email, tags: tags || [], notes: notes || "", updated_at: new Date().toISOString() }, { onConflict: "email" });
    return Response.json({ ok: true });
  }

  const { id, unsubscribed } = body;
  if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.contacts.update({ audienceId: AUDIENCE_ID, id, unsubscribed });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const { id } = await request.json().catch(() => ({}));
  if (!id) return Response.json({ error: "Falta id" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.contacts.remove({ audienceId: AUDIENCE_ID, id });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
