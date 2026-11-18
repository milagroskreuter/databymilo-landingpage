import { Resend } from "resend";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const contacts = (data?.data ?? []);
  const active = contacts.filter((c) => !c.unsubscribed);
  return Response.json({
    data: contacts,
    total: contacts.length,
    active: active.length,
  });
}

export async function DELETE(request) {
  const { id } = await request.json().catch(() => ({}));
  if (!id) return Response.json({ error: "Falta id" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.contacts.remove({ audienceId: AUDIENCE_ID, id });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
