import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function POST(request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
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

  return Response.json({ ok: true });
}
