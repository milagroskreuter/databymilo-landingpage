import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
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

  const suggestion =
    typeof body?.suggestion === "string" ? body.suggestion.trim() : "";

  if (!suggestion || suggestion.length < 5 || suggestion.length > 600) {
    return Response.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Data by Milo <noreply@databymilo.me>",
    to: "databymilo@gmail.com",
    subject: "✦ Nueva sugerencia de recurso",
    text: `Nueva sugerencia de recurso desde databymilo.me:\n\n${suggestion}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "No se pudo enviar" }, { status: 500 });
  }

  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
