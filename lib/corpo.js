import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { esc, notifyAdmin, SITE_URL } from "@/lib/notify";
import { fetchSubscribers, listUnsubUrl } from "@/lib/lists";

const FROM = "Milo · Edición Corpo <hola@databymilo.me>";
const BATCH_SIZE = 100; // máximo que acepta Resend por llamada de batch

export function corpoUnsubUrl(email) {
  return listUnsubUrl(email, "corpo");
}

/** Una nota está "en vivo" si está publicada o su fecha programada ya pasó. */
export function isLive(post) {
  if (!post) return false;
  if (post.published === true) return true;
  return !!post.publish_at && new Date(post.publish_at) <= new Date();
}

function absoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function postEmailHtml(post, email, firstName) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const greeting = firstName ? `Hola, ${esc(firstName)}` : "Hola";
  const cover = absoluteUrl(post.cover_image);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(post.title)}</title>
</head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f2b7d1;margin-bottom:8px;">Data by Milo</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:15px;color:rgba(253,245,236,.7);letter-spacing:.06em;">edición corpo · nota nueva</div>
        </td></tr>

        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;padding:40px 40px 32px;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:19px;color:#1a0a10;margin:0 0 20px;line-height:1.4;">${greeting} ✦</p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.7;margin:0 0 24px;">Acabo de subir una nota nueva a la edición corpo:</p>

          ${cover ? `<a href="${url}"><img src="${esc(cover)}" alt="" style="display:block;width:100%;max-width:480px;border-radius:10px;margin:0 0 24px;border:0;" /></a>` : ""}

          <p style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:26px;color:#8b1a4a;margin:0 0 14px;line-height:1.2;">${esc(post.title)}</p>
          ${post.excerpt ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.7;margin:0 0 28px;">${esc(post.excerpt)}</p>` : ""}

          <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
            <tr><td style="background:#8b1a4a;border-radius:999px;padding:14px 32px;">
              <a href="${url}" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:#fdf5ec;text-decoration:none;letter-spacing:.04em;">Leer la nota &rarr;</a>
            </td></tr>
          </table>

          <hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 24px;" />
          <p style="font-family:Georgia,serif;font-style:italic;font-size:36px;color:#8b1a4a;margin:0 0 4px;line-height:1;">milo</p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a07080;margin:0;">Data by Milo · <a href="${SITE_URL}" style="color:#8b1a4a;text-decoration:none;">databymilo.me</a></p>
        </td></tr>

        <tr><td style="background:#f5e6d8;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a07080;margin:0;line-height:1.6;">
            Recibís este mail porque pediste que te avisen de las notas nuevas de la edición corpo en databymilo.me.<br/>
            <a href="${corpoUnsubUrl(email)}" style="color:#8b1a4a;text-decoration:underline;">Dejar de recibir avisos de notas</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Avisa a las suscriptoras de Edición Corpo que hay una nota nueva.
 * Es idempotente: cada nota se avisa una sola vez (tabla corpo_post_notifications),
 * así que se puede llamar al publicar, al editar o desde el cron sin duplicar envíos.
 * Nunca lanza.
 */
export async function notifyNewPost(post) {
  try {
    if (!isLive(post)) return { status: "not_live" };

    const supabase = getSupabaseAdmin();

    // "Reservar" la nota: si ya existe la fila, ya fue avisada.
    const { error: claimError } = await supabase
      .from("corpo_post_notifications")
      .insert({ post_slug: post.slug, recipients: 0 });
    if (claimError) {
      if (claimError.code === "23505") return { status: "already_sent" };
      throw new Error(claimError.message);
    }

    const recipients = await fetchSubscribers(supabase, "corpo", { onlyActive: true });
    let sent = 0;

    if (recipients.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const chunk = recipients.slice(i, i + BATCH_SIZE);
        const { error } = await resend.batch.send(
          chunk.map((r) => ({
            from: FROM,
            to: r.email,
            replyTo: "hola@databymilo.me",
            subject: `Nota nueva: ${post.title}`,
            html: postEmailHtml(post, r.email, r.first_name),
            headers: { "List-Unsubscribe": `<${corpoUnsubUrl(r.email)}>` },
          }))
        );
        if (error) console.error("notifyNewPost batch error:", error);
        else sent += chunk.length;
      }

      // Si no salió ni un solo mail, se libera la reserva para que el cron reintente.
      if (sent === 0) {
        await supabase.from("corpo_post_notifications").delete().eq("post_slug", post.slug);
        await notifyAdmin({
          type: "post_notified",
          title: `No se pudo avisar la nota "${post.title}"`,
          body: "Falló el envío a Edición Corpo. Se va a reintentar automáticamente.",
          metadata: { slug: post.slug, failed: true },
        });
        return { status: "failed" };
      }

      await supabase
        .from("corpo_post_notifications")
        .update({ recipients: sent })
        .eq("post_slug", post.slug);
    }

    await notifyAdmin({
      type: "post_notified",
      title: `Nota avisada: ${post.title}`,
      body:
        sent > 0
          ? `Se mandó el aviso a ${sent} ${sent === 1 ? "suscriptora" : "suscriptoras"} de Edición Corpo.`
          : "Todavía no hay suscriptoras a Edición Corpo, así que no se mandó ningún mail.",
      metadata: { slug: post.slug, recipients: sent },
    });

    return { status: "sent", recipients: sent };
  } catch (err) {
    console.error("notifyNewPost error:", err);
    return { status: "error" };
  }
}
