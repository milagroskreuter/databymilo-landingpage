import { Resend } from "resend";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

function inlineFormat(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#8b1a4a;text-decoration:underline;">$1</a>');
}

function buildHtml(subject, body, headerStyle = "oscuro") {
  const unsubPlaceholder = "{{ RESEND_UNSUBSCRIBE_URL }}";

  const headerHtml = headerStyle === "claro"
    ? `<tr><td style="background:linear-gradient(135deg,#fce8f0 0%,#fdf5ec 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid rgba(139,26,74,.12);">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8b1a4a;margin-bottom:8px;font-weight:700;">
          Data by Milo
        </div>
        <div style="font-family:Georgia,serif;font-weight:700;font-size:28px;color:#8b1a4a;line-height:1.2;">
          La Carta del Domingo
        </div>
      </td></tr>`
    : `<tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f2b7d1;margin-bottom:8px;">
          Data by Milo
        </div>
        <div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:15px;color:rgba(253,245,236,.7);letter-spacing:.06em;">
          la carta del domingo
        </div>
      </td></tr>`;

  const isHtml = body.trim().startsWith("<");
  const blocks = isHtml ? [] : body.split("\n\n").filter(Boolean);
  const bodyHtml = isHtml ? body.replace(/<script[\s\S]*?<\/script>/gi, "") : blocks.map((block) => {
    if (block.startsWith("> ")) {
      const text = inlineFormat(block.slice(2));
      return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
        <tr><td style="border-left:4px solid #d4447a;padding:16px 20px;background:#fdf0f6;border-radius:0 10px 10px 0;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#8b1a4a;margin:0;line-height:1.5;">${text}</p>
        </td></tr>
      </table>`;
    }

    if (block.startsWith("[box]") && block.endsWith("[/box]")) {
      const text = inlineFormat(block.slice(5, -6));
      return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
        <tr><td style="background:#8b1a4a;border-radius:12px;padding:24px 28px;text-align:center;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#fdf5ec;margin:0;line-height:1.45;">${text}</p>
        </td></tr>
      </table>`;
    }

    if (block.trim() === "---") {
      return `<hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 24px;" />`;
    }

    if (block.startsWith("# ")) {
      const text = inlineFormat(block.slice(2));
      return `<p style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#1a0a10;margin:0 0 20px;line-height:1.35;">${text}</p>`;
    }

    // Imagen: ![](url)
    if (block.startsWith("![](")) {
      const url = block.slice(4, -1);
      return `<div style="margin:0 0 24px;text-align:center;"><img src="${url}" alt="" style="max-width:100%;border-radius:8px;" /></div>`;
    }

    // CTA button: [cta texto](url)
    const ctaM = block.match(/^\[cta (.+?)\]\((.+?)\)$/);
    if (ctaM) {
      return `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#8b1a4a;border-radius:999px;padding:13px 28px;">
          <a href="${ctaM[2]}" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:#fdf5ec;text-decoration:none;letter-spacing:.04em;">${ctaM[1]} &rarr;</a>
        </td></tr>
      </table>`;
    }

    const escaped = inlineFormat(block);
    return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 20px;">${escaped}</p>`;
  }).join("\n");

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

        ${headerHtml}

        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;padding:40px 40px 32px;">
          ${bodyHtml}

          <hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 24px;" />
          <p style="font-family:Georgia,serif;font-style:italic;font-size:36px;color:#8b1a4a;margin:0 0 4px;line-height:1;">
            milo
          </p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a07080;margin:0 0 24px;line-height:1.5;">
            Data by Milo · <a href="https://databymilo.me" style="color:#8b1a4a;text-decoration:none;">databymilo.me</a>
          </p>

          <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0;">
            <tr>
              <td style="padding-right:10px;"><a href="https://www.instagram.com/databymilo"><img src="https://databymilo.me/icons/email/social-instagram.png" width="32" height="32" alt="Instagram" style="display:block;border:0;" /></a></td>
              <td style="padding-right:10px;"><a href="https://ar.pinterest.com/databymilo/"><img src="https://databymilo.me/icons/email/social-pinterest.png" width="32" height="32" alt="Pinterest" style="display:block;border:0;" /></a></td>
              <td><a href="https://www.linkedin.com/in/milagroskreuter/"><img src="https://databymilo.me/icons/email/social-linkedin.png" width="32" height="32" alt="LinkedIn" style="display:block;border:0;" /></a></td>
            </tr>
          </table>
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

function interpolate(text, contact) {
  if (!contact) return text;
  return text
    .replace(/\{\{nombre\}\}/gi, contact.firstName || contact.first_name || "")
    .replace(/\{\{apellido\}\}/gi, contact.lastName || contact.last_name || "")
    .replace(/\{\{email\}\}/gi, contact.email || "");
}

export async function POST(request) {
  const { subject, subjectB, body, sendAt, to, tagFilter, headerStyle } = await request.json().catch(() => ({}));
  if (!subject || !body) {
    return Response.json({ error: "Faltan subject o body" }, { status: 400 });
  }
  const hs = headerStyle || "oscuro";

  const resend = new Resend(process.env.RESEND_API_KEY);

  // A/B testing: split audience and send two subjects
  if (subjectB && !to) {
    const { data: audienceData } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    let contacts = (audienceData?.data ?? []).filter(c => !c.unsubscribed);

    // Apply tag filter if requested
    if (tagFilter) {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();
      const { data: tags } = await supabase.from("contact_tags").select("email, tags").contains("tags", [tagFilter]);
      const tagEmails = new Set((tags || []).map(t => t.email));
      contacts = contacts.filter(c => tagEmails.has(c.email));
    }

    const half = Math.ceil(contacts.length / 2);
    const groupA = contacts.slice(0, half);
    const groupB = contacts.slice(half);

    const sendGroup = async (group, subj) => {
      return Promise.allSettled(group.map(c =>
        resend.emails.send({
          from: "Milo · Data by Milo <hola@databymilo.me>",
          to: c.email, replyTo: "hola@databymilo.me",
          subject: interpolate(subj, c),
          html: buildHtml(interpolate(subj, c), interpolate(body, c), hs),
          scheduledAt: sendAt || undefined,
        })
      ));
    };

    await Promise.all([sendGroup(groupA, subject), sendGroup(groupB, subjectB)]);
    return Response.json({ ok: true, mode: "ab_test", groupA: groupA.length, groupB: groupB.length });
  }

  // Send to contacts with a specific tag
  if (tagFilter && !to && !subjectB) {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const supabase = getSupabaseAdmin();
    const { data: tags } = await supabase.from("contact_tags").select("email").contains("tags", [tagFilter]);
    const tagEmails = new Set((tags || []).map(t => t.email));

    const { data: audienceData } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const filtered = (audienceData?.data ?? []).filter(c => !c.unsubscribed && tagEmails.has(c.email));

    const results = await Promise.allSettled(filtered.map(c =>
      resend.emails.send({
        from: "Milo · Data by Milo <hola@databymilo.me>",
        to: c.email, replyTo: "hola@databymilo.me",
        subject: interpolate(subject, c),
        html: buildHtml(interpolate(subject, c), interpolate(body, c), hs),
        scheduledAt: sendAt || undefined,
      })
    ));
    return Response.json({ ok: true, sent: filtered.length, mode: "tag_filter" });
  }

  // Send to a specific email address (or list of addresses)
  if (to) {
    const recipients = Array.isArray(to) ? to : [to];
    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        const contact = typeof recipient === "object" ? recipient : { email: recipient };
        const toEmail = contact.email || contact;
        return resend.emails.send({
          from: "Milo · Data by Milo <hola@databymilo.me>",
          to: toEmail,
          replyTo: "hola@databymilo.me",
          subject: interpolate(subject, contact),
          html: buildHtml(interpolate(subject, contact), interpolate(body, contact), hs),
          scheduledAt: sendAt || undefined,
        });
      })
    );
    const failed = results.filter(r => r.status === "rejected" || r.value?.error);
    if (failed.length > 0) {
      const msg = failed[0].reason?.message || failed[0].value?.error?.message || "Error al enviar";
      return Response.json({ error: msg }, { status: 500 });
    }
    return Response.json({ ok: true, sent: recipients.length, mode: "individual" });
  }

  // Broadcast to entire audience
  const { data: broadcast, error: createErr } = await resend.broadcasts.create({
    audienceId: AUDIENCE_ID,
    from: "Milo · Data by Milo <hola@databymilo.me>",
    replyTo: "hola@databymilo.me",
    subject,
    html: buildHtml(subject, body, hs),
  });

  if (createErr) {
    return Response.json({ error: createErr.message }, { status: 500 });
  }

  const payload = sendAt ? { scheduledAt: sendAt } : {};
  const { error: sendErr } = await resend.broadcasts.send(broadcast.id, payload);
  if (sendErr) {
    return Response.json({ error: sendErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, id: broadcast.id, mode: "broadcast" });
}
