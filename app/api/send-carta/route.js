import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function POST(req) {
  // Simple one-time secret check via header
  const auth = req.headers.get("x-send-secret");
  if (auth !== "carta-domingo-2026") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Read the HTML template from disk
  const html = readFileSync(
    join(process.cwd(), "email-templates", "carta-del-domingo.html"),
    "utf8"
  );

  // 1. Create the broadcast
  const { data: broadcast, error: bError } = await resend.broadcasts.create({
    audience_id: AUDIENCE_ID,
    from: "Milo · Data by Milo <hola@databymilo.me>",
    name: "La carta del Domingo — 25 may 2026",
    subject: "mis dashboards, un agente de IA, y la pregunta que no me deja dormir",
    html,
  });

  if (bError) {
    console.error("Error creating broadcast:", bError);
    return Response.json({ error: bError }, { status: 500 });
  }

  // 2. Send it immediately
  const { data: sent, error: sError } = await resend.broadcasts.send(
    broadcast.id
  );

  if (sError) {
    console.error("Error sending broadcast:", sError);
    return Response.json({ broadcast_id: broadcast.id, error: sError }, { status: 500 });
  }

  return Response.json({
    ok: true,
    broadcast_id: broadcast.id,
    sent,
  });
}
