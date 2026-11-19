import { Resend } from "resend";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function GET(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const { data, error } = await resend.broadcasts.get(id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const html = data?.html || "";
    const body = html.match(/<!--BODY_START-->([\s\S]*?)<!--BODY_END-->/);
    const header = html.match(/<!--HEADER:(\w+)-->/);
    return Response.json({
      id,
      subject: data?.subject || "",
      scheduledAt: data?.scheduled_at || null,
      status: data?.status || null,
      body: body ? body[1] : null,
      headerStyle: header ? header[1] : "oscuro",
    });
  }

  const { data, error } = await resend.broadcasts.list();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const broadcasts = data?.data ?? [];

  // Fetch metrics for each broadcast in parallel (best effort)
  const withMetrics = await Promise.all(
    broadcasts.map(async (b) => {
      try {
        const { data: detail } = await resend.broadcasts.get(b.id);
        return { ...b, metrics: detail?.metrics ?? null };
      } catch {
        return b;
      }
    })
  );

  return Response.json({ data: withMetrics });
}

export async function DELETE(request) {
  const { id } = await request.json().catch(() => ({}));
  if (!id) return Response.json({ error: "Falta id" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.broadcasts.remove(id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
