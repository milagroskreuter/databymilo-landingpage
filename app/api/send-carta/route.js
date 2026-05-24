import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

const RESEND_BASE = "https://api.resend.com";

async function resendPost(path, body, apiKey) {
  const res = await fetch(`${RESEND_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req) {
  const auth = req.headers.get("x-send-secret");
  if (auth !== "carta-domingo-2026") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "No RESEND_API_KEY" }, { status: 500 });
  }

  // Read the HTML template
  const html = readFileSync(
    join(process.cwd(), "email-templates", "carta-del-domingo.html"),
    "utf8"
  );

  // 1. Create broadcast
  const create = await resendPost(
    "/broadcasts",
    {
      audience_id: AUDIENCE_ID,
      from: "Milo · Data by Milo <hola@databymilo.me>",
      name: "La carta del Domingo — 25 may 2026",
      subject:
        "mis dashboards, un agente de IA, y la pregunta que no me deja dormir",
      html,
    },
    apiKey
  );

  if (!create.ok) {
    return Response.json({ step: "create", error: create.data }, { status: 500 });
  }

  const broadcastId = create.data.id;

  // 2. Send immediately
  const send = await resendPost(
    `/broadcasts/${broadcastId}/send`,
    {},
    apiKey
  );

  if (!send.ok) {
    return Response.json(
      { step: "send", broadcast_id: broadcastId, error: send.data },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, broadcast_id: broadcastId, result: send.data });
}
