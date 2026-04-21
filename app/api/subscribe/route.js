import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Data by Milo <onboarding@resend.dev>",
    to: "databymilo@gmail.com",
    subject: `Nueva suscriptora: ${email}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #fdf5ec; border-radius: 12px;">
        <p style="font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: #8b1a4a; margin: 0 0 24px;">Data by Milo · Newsletter</p>
        <h1 style="font-size: 28px; color: #1a1a1a; margin: 0 0 16px; line-height: 1.2;">
          ¡Nuevo registro! ✦
        </h1>
        <p style="font-size: 18px; color: #3a2a30; line-height: 1.65; margin: 0;">
          <strong>${email}</strong> se suscribió a La carta del domingo.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "No se pudo enviar" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
