import { Resend } from "resend";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

function buildHtml(subject, body) {
  const unsubPlaceholder = "{{ RESEND_UNSUBSCRIBE_URL }}";
  const bodyHtml = body
    .split("\n\n")
    .filter(Boolean)
    .map((para) => {
      const escaped = para.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 20px;">${escaped}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f2b7d1;margin-bottom:8px;">
            Data by Milo
          </div>
          <div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:15px;color:rgba(253,245,236,.7);letter-spacing:.06em;">
            la carta del domingo
          </div>
        </td></tr>

        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;padding:40px 40px 32px;">
          ${bodyHtml}

          <hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 24px;" />
          <p style="font-family:Georgia,serif;font-style:italic;font-size:36px;color:#8b1a4a;margin:0 0 4px;line-height:1;">
            milo
          </p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a07080;margin:0;line-height:1.5;">
            Data by Milo · <a href="https://databymilo.me" style="color:#8b1a4a;text-decoration:none;">databymilo.me</a>
          </p>
        </td></tr>

        <tr><td style="background:#f5e6d8;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a07080;margin:0;line-height:1.6;">
            Recibís este mail porque te suscribiste en databymilo.me.<br/>
            <a href="${unsubPlaceholder}" style="color:#8b1a4a;text-decoration:underline;">Cancelar suscripción</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request) {
  const { subject, body, sendAt } = await request.json().catch(() => ({}));
  if (!subject || !body) {
    return Response.json({ error: "Faltan subject o body" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Create broadcast
  const { data: broadcast, error: createErr } = await resend.broadcasts.create({
    audienceId: AUDIENCE_ID,
    from: "Milo · Data by Milo <hola@databymilo.me>",
    replyTo: "hola@databymilo.me",
    subject,
    html: buildHtml(subject, body),
  });

  if (createErr) {
    return Response.json({ error: createErr.message }, { status: 500 });
  }

  // Send the broadcast
  const payload = sendAt ? { scheduledAt: sendAt } : {};
  const { error: sendErr } = await resend.broadcasts.send(broadcast.id, payload);
  if (sendErr) {
    return Response.json({ error: sendErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, id: broadcast.id });
}
