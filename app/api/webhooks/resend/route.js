import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Resend avisa acá cuando alguien se da de baja desde el link propio de Resend
// que llevan los envíos masivos de La carta del domingo (esas bajas no pasan
// por /api/unsubscribe). Se activa configurando RESEND_WEBHOOK_SECRET.

async function alreadyNotified(supabase, email) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("admin_notifications")
    .select("id")
    .eq("type", "unsubscribe")
    .eq("metadata->>email", email)
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const payload = await request.text();

  let event;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    event = resend.webhooks.verify({
      payload,
      headers: request.headers,
      webhookSecret: secret,
    });
  } catch {
    return Response.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "contact.updated" && event.data?.unsubscribed === true) {
    const email = String(event.data.email || "").toLowerCase();
    if (email) {
      try {
        const supabase = getSupabaseAdmin();
        if (!(await alreadyNotified(supabase, email))) {
          await notifyAdmin({
            type: "unsubscribe",
            title: `Baja: ${email}`,
            body: "Se dio de baja de La carta del domingo.",
            metadata: { email, list: "carta", source: "resend" },
          });
        }
      } catch (err) {
        console.error("Resend webhook error:", err);
      }
    }
  }

  return Response.json({ ok: true });
}
