import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

export const SITE_URL = "https://databymilo.me";
export const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || "databymilo@gmail.com";
const FROM = "Data by Milo <hola@databymilo.me>";

// Si llegan más de este número de avisos por mail en una hora (ej. un bot
// suscribiendo mails falsos), se siguen guardando en el hub pero se deja de
// mandar mail para no llenar la bandeja.
const MAX_ADMIN_EMAILS_PER_HOUR = 15;

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminEmailHtml({ title, body }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:18px 28px;">
          <span style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#f2b7d1;">Data by Milo · hub de admin</span>
        </td></tr>
        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;border-radius:0 0 12px 12px;padding:28px;">
          <p style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:20px;color:#1a0a10;margin:0 0 10px;line-height:1.3;">${esc(title)}</p>
          ${body ? `<p style="font-size:14px;color:#3d1a2a;line-height:1.65;margin:0 0 22px;white-space:pre-line;">${esc(body)}</p>` : ""}
          <a href="${SITE_URL}/administracion-general/notificaciones" style="display:inline-block;background:#8b1a4a;color:#fdf5ec;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.04em;padding:11px 24px;border-radius:999px;">Abrir el hub &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function emailBudgetLeft(supabase) {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    return (count ?? 0) <= MAX_ADMIN_EMAILS_PER_HOUR;
  } catch {
    return true;
  }
}

/**
 * Guarda una notificación en el hub (campanita) y avisa por mail a la admin.
 * Nunca lanza: una falla acá no debe romper la suscripción ni la publicación.
 */
export async function notifyAdmin({ type, title, body = "", metadata = {} }) {
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("notifyAdmin: supabase no disponible:", err.message);
  }

  const tasks = [];

  if (supabase) {
    tasks.push(
      supabase
        .from("admin_notifications")
        .insert({ type, title, body, metadata })
        .then(({ error }) => {
          if (error) console.error("notifyAdmin: no se pudo guardar:", error.message);
        })
    );
  }

  tasks.push(
    (async () => {
      if (!process.env.RESEND_API_KEY) return;
      if (supabase && !(await emailBudgetLeft(supabase))) return;
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM,
        to: ADMIN_NOTIFY_EMAIL,
        subject: `✦ ${title}`,
        html: adminEmailHtml({ title, body }),
      });
      if (error) console.error("notifyAdmin: no se pudo enviar el mail:", error);
    })()
  );

  // Se espera todo: en Vercel el trabajo pendiente se corta al devolver la respuesta.
  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") console.error("notifyAdmin error:", r.reason);
  }
}
