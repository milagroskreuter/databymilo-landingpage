import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

// Practical email regex: local@domain.tld with minimum 2-char TLD
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

export async function POST(request) {
  // Reject non-JSON content types
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

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const { error } = await resend.contacts.create({
    email,
    audienceId: AUDIENCE_ID,
    unsubscribed: false,
  });

  if (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Reject all other HTTP methods explicitly
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
