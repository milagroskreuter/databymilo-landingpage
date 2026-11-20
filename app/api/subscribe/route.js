import { Resend } from "resend";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { subscribeCorpo, LISTS } from "@/lib/corpo";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

/** Alta en La carta del domingo (audiencia de Resend). */
async function subscribeCarta(resend, email, firstName) {
  // Resend hace "upsert" al crear, así que primero miramos si ya existía
  // para poder distinguir una suscripción nueva de un reenvío del formulario.
  let status = "new";
  try {
    const { data: existing } = await resend.contacts.get({ audienceId: AUDIENCE_ID, email });
    if (existing?.id) status = existing.unsubscribed ? "resubscribed" : "existing";
  } catch {}

  if (status === "existing") return status;

  const { error } = await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    audienceId: AUDIENCE_ID,
    unsubscribed: false,
  });
  if (error) throw new Error(error.message || "Resend contact error");
  return status;
}

export async function POST(request) {
  const { ok } = rateLimit(`subscribe:${getIp(request)}`, { max: 5, windowMs: 60_000 });
  if (!ok) return Response.json({ error: "Demasiados intentos" }, { status: 429 });

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName =
    typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  // Listas a las que se suma. Sin el campo, el comportamiento de siempre: solo la carta.
  let lists = ["carta"];
  if (body?.lists !== undefined) {
    lists = Array.isArray(body.lists)
      ? [...new Set(body.lists.filter((l) => typeof l === "string" && l in LISTS))]
      : [];
    if (lists.length === 0) {
      return Response.json({ error: "Elegí al menos una lista" }, { status: 400 });
    }
  }

  const statuses = {};
  const failed = [];

  if (lists.includes("carta")) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      statuses.carta = await subscribeCarta(resend, email, firstName);
    } catch (err) {
      console.error("Subscribe carta error:", err);
      failed.push("carta");
    }
  }

  if (lists.includes("corpo")) {
    try {
      statuses.corpo = await subscribeCorpo(getSupabaseAdmin(), email, firstName);
    } catch (err) {
      console.error("Subscribe corpo error:", err);
      failed.push("corpo");
    }
  }

  // Si no se pudo guardar en ninguna lista, es un error para quien se suscribe.
  if (failed.length === lists.length) {
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  // Aviso a la admin solo si hubo altas reales (no por reenvíos de quien ya estaba).
  const changed = Object.entries(statuses).filter(([, s]) => s !== "existing");
  if (changed.length > 0) {
    const allBack = changed.every(([, s]) => s === "resubscribed");
    const names = changed.map(([l]) => LISTS[l]).join(" y ");
    await notifyAdmin({
      type: "subscribe",
      title: `${allBack ? "Volvió a suscribirse" : "Nueva suscripción"}: ${email}`,
      body: [
        firstName ? `Nombre: ${firstName}` : null,
        `Lista${changed.length > 1 ? "s" : ""}: ${names}`,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: { email, name: firstName || null, lists: changed.map(([l]) => l), statuses },
    });
  }

  return Response.json(
    { ok: true, lists: Object.keys(statuses) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
