import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/notify";
import { CONTENT_TABLE } from "@/lib/marketing/content";
import { computeReminders } from "@/lib/marketing/content/reminders";
import { arDateKey, arDayStartISO, DAY_MS } from "@/lib/marketing/content/dates";

export const dynamic = "force-dynamic";

// Corre una vez por día (ver vercel.json). Avisa en la campanita (y por mail):
// piezas para hoy, piezas atrasadas y redes principales sin nada en 7 días.
// Cada tipo de aviso se manda una sola vez por día (hora de Argentina).

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  // Sin CRON_SECRET se acepta solo la llamada del cron de Vercel. Es idempotente
  // en el día, así que una llamada extra no repite avisos.
  return (request.headers.get("user-agent") || "").startsWith("vercel-cron");
}

export async function GET(request) {
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = Date.now();
    const today = arDateKey(now);
    const todayStart = arDayStartISO(today);
    const until = new Date(now + 8 * DAY_MS).toISOString();

    // Todo lo que tiene fecha hasta dentro de 8 días y no está descartado:
    // las abiertas sirven para hoy/atrasadas y todas para "redes sin nada".
    // Las publicadas viejas no hacen falta, así que se acota a las de hoy en adelante.
    const [open, published] = await Promise.all([
      supabase
        .from(CONTENT_TABLE)
        .select("id, title, status, network, scheduled_at")
        .not("scheduled_at", "is", null)
        .lt("scheduled_at", until)
        .not("status", "in", "(publicado,descartado)")
        .order("scheduled_at")
        .limit(1000),
      supabase
        .from(CONTENT_TABLE)
        .select("id, title, status, network, scheduled_at")
        .eq("status", "publicado")
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", until),
    ]);
    if (open.error) throw new Error(open.error.message);
    if (published.error) throw new Error(published.error.message);

    const reminders = computeReminders([...(open.data || []), ...(published.data || [])], { now });

    const { data: sentToday, error: sentErr } = await supabase
      .from("admin_notifications")
      .select("metadata")
      .eq("type", "marketing_reminder")
      .gte("created_at", todayStart);
    if (sentErr) throw new Error(sentErr.message);
    const sentKinds = new Set((sentToday || []).map((n) => n.metadata?.kind).filter(Boolean));

    const sent = [];
    for (const r of reminders) {
      if (sentKinds.has(r.kind)) continue;
      await notifyAdmin({ type: "marketing_reminder", title: r.title, body: r.body, metadata: r.metadata });
      sent.push(r.kind);
    }

    return Response.json({ ok: true, day: today, computed: reminders.map((r) => r.kind), sent });
  } catch (err) {
    console.error("marketing-reminders cron error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
