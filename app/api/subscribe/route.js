import { Resend } from "resend";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

function unsubUrl(email) {
  return `https://databymilo.me/api/unsubscribe?e=${Buffer.from(email).toString("base64")}`;
}

function welcomeHtml(firstName, email) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bienvenida a la carta del domingo</title>
</head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f2b7d1;margin-bottom:10px;">
            Data by Milo
          </div>
          <div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:28px;color:#fdf5ec;line-height:1.15;">
            La carta del domingo.
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;padding:40px 40px 32px;">

          <p style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#1a0a10;margin:0 0 12px;line-height:1.45;">
            ${greeting} ✦
          </p>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.7;margin:0 0 20px;">
            ¡Gracias por sumarte! Me alegra mucho tenerte acá.
          </p>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.7;margin:0 0 16px;">
            Los domingos a las 9 te escribo algo así:
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="color:#d4447a;font-size:14px;padding-right:10px;vertical-align:top;padding-top:3px;">✦</td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.65;padding-bottom:8px;">Algo de la semana en la corpo. Lo que pasó de verdad, no la versión para LinkedIn.</td>
            </tr>
            <tr>
              <td style="color:#d4447a;font-size:14px;padding-right:10px;vertical-align:top;padding-top:3px;">✦</td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.65;padding-bottom:8px;">Lo que está pasando con la IA en las empresas, sin el hype.</td>
            </tr>
            <tr>
              <td style="color:#d4447a;font-size:14px;padding-right:10px;vertical-align:top;padding-top:3px;">✦</td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.65;">Una reflexión que no entró en ningún post.</td>
            </tr>
          </table>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.7;margin:0 0 20px;">
            Mientras tanto, podés arrancar por acá:
          </p>

          <!-- CTA buttons -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 40px;">
            <tr>
              <td style="padding-right:12px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#8b1a4a;border-radius:999px;padding:13px 28px;">
                    <a href="https://databymilo.me/blog" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:#fdf5ec;text-decoration:none;letter-spacing:.04em;">
                      Leer el blog &rarr;
                    </a>
                  </td></tr>
                </table>
              </td>
              <td>
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#fdf5ec;border:1.5px solid #8b1a4a;border-radius:999px;padding:13px 28px;">
                    <a href="https://databymilo.me/recursos" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:#8b1a4a;text-decoration:none;letter-spacing:.04em;">
                      Ver los recursos &rarr;
                    </a>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Redes sociales -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="padding-bottom:10px;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#a07080;">Instagram</span>
              &nbsp;&nbsp;
              <a href="https://www.instagram.com/databymilo" style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#8b1a4a;text-decoration:none;">@databymilo</a>
            </td></tr>
            <tr><td style="padding-bottom:10px;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#a07080;">Pinterest</span>
              &nbsp;&nbsp;
              <a href="https://ar.pinterest.com/databymilo/" style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#8b1a4a;text-decoration:none;">@databymilo</a>
            </td></tr>
            <tr><td>
              <span style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#a07080;">LinkedIn</span>
              &nbsp;&nbsp;
              <a href="https://www.linkedin.com/in/milagroskreuter/" style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#8b1a4a;text-decoration:none;">milagros kreuter</a>
            </td></tr>
          </table>

          <!-- Signature -->
          <hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 28px;" />

          <p style="font-family:Georgia,serif;font-style:italic;font-size:36px;color:#8b1a4a;margin:0 0 4px;line-height:1;">
            milo
          </p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a07080;margin:0;line-height:1.5;">
            Data by Milo · <a href="https://databymilo.me" style="color:#8b1a4a;text-decoration:none;">databymilo.me</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5e6d8;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a07080;margin:0;line-height:1.6;">
            Recibís este mail porque te suscribiste en databymilo.me.<br/>
            <a href="${unsubUrl(email)}" style="color:#8b1a4a;text-decoration:underline;">Cancelar suscripción</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function followUpHtml(firstName, email) {
  const greeting = firstName ? `${firstName}` : "hola";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>la pregunta que cambió cómo hago todo análisis</title>
</head>
<body style="margin:0;padding:0;background:#fdf5ec;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5ec;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#8b1a4a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f2b7d1;margin-bottom:8px;">
            Data by Milo
          </div>
          <div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:15px;color:rgba(253,245,236,.7);letter-spacing:.06em;">
            antes del primer domingo
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fffcf6;border:1px solid rgba(139,26,74,.1);border-top:none;padding:40px 40px 32px;">

          <!-- Greeting -->
          <p style="font-family:Georgia,serif;font-style:italic;font-size:19px;color:#1a0a10;margin:0 0 24px;line-height:1.4;">
            ${greeting},
          </p>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 16px;">
            antes de que llegue el primer domingo quería mandarte una sola cosa.
          </p>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 28px;">
            Una que aprendí tarde y que ojalá alguien me hubiera dicho antes de que yo me perdiera horas mirando columnas sin saber qué estaba buscando.
          </p>

          <!-- THE TIP — highlighted box -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
            <tr><td style="background:#fdf0f6;border-left:4px solid #d4447a;border-radius:0 10px 10px 0;padding:20px 24px;">
              <p style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:20px;color:#8b1a4a;margin:0 0 4px;line-height:1.3;">
                Escribí la pregunta antes de abrir Excel.
              </p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a07080;margin:0;">
                en serio.
              </p>
            </td></tr>
          </table>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 16px;">
            En un post-it, en una nota del celu, donde sea. Una sola oración:
          </p>

          <!-- Post-it examples -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
            <tr><td style="background:#fef9c3;border-radius:8px;padding:20px 24px;border:1px solid #f5e47a;">
              <p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#5c4a00;margin:0 0 10px;line-height:1.7;">
                — ¿cuál fue mi mes con más gastos en delivery?
              </p>
              <p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#5c4a00;margin:0 0 10px;line-height:1.7;">
                — ¿qué playlist de Spotify escucho más durante el mes?
              </p>
              <p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#5c4a00;margin:0;line-height:1.7;">
                — ¿cuál de mis ventas vino del DM y cuál del posteo?
              </p>
            </td></tr>
          </table>

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 28px;">
            Si no podés escribirla, no estás lista para abrir el archivo todavía.<br/>
            Y eso no es problema tuyo: es señal.
          </p>

          <!-- 70/30 callout -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
            <tr><td style="background:#8b1a4a;border-radius:12px;padding:28px 32px;text-align:center;">
              <p style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:32px;color:#fdf5ec;margin:0 0 6px;line-height:1.1;">
                La pregunta es el 70%.
              </p>
              <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:rgba(253,245,236,.75);margin:0 0 20px;line-height:1.3;">
                La fórmula es el 30%.
              </p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#f2b7d1;margin:0;line-height:1.6;letter-spacing:.01em;">
                Todo el mundo te enseña fórmulas.<br/>
                Nadie te enseña a preguntarle bien a la tabla.
              </p>
            </td></tr>
          </table>

          <!-- CTA -->
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 8px;">
            Si esto te hizo click, hay más en el recurso que armé para arrancar bien.
          </p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d1a2a;line-height:1.75;margin:0 0 28px;">
            No es un curso. Son las cosas concretas que me hubiera gustado tener desde el principio.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 40px;">
            <tr><td style="background:#8b1a4a;border-radius:999px;padding:14px 32px;">
              <a href="https://databymilo.me/recursos" style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:14px;color:#fdf5ec;text-decoration:none;letter-spacing:.04em;">
                Ir al recurso &rarr;
              </a>
            </td></tr>
          </table>

          <!-- Signature -->
          <hr style="border:none;border-top:1px dashed rgba(139,26,74,.2);margin:0 0 24px;" />

          <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#a07080;margin:0 0 4px;">
            nos hablamos el domingo.
          </p>
          <p style="font-family:Georgia,serif;font-style:italic;font-size:36px;color:#8b1a4a;margin:0 0 4px;line-height:1;">
            milo
          </p>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a07080;margin:0;">
            Data by Milo · <a href="https://databymilo.me" style="color:#8b1a4a;text-decoration:none;">databymilo.me</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5e6d8;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a07080;margin:0;line-height:1.6;">
            Recibís este mail porque te suscribiste en databymilo.me.<br/>
            <a href="${unsubUrl(email)}" style="color:#8b1a4a;text-decoration:underline;">Cancelar suscripción</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName =
    typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    audienceId: AUDIENCE_ID,
    unsubscribed: false,
  });

  if (error) {
    console.error("Resend contact error:", error);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // Await both sends — Vercel kills pending async work once the response is returned
  const [welcome, followUp] = await Promise.allSettled([
    resend.emails.send({
      from: "Milo · Data by Milo <hola@databymilo.me>",
      to: email,
      subject: "Bienvenida a la carta del domingo ✦",
      html: welcomeHtml(firstName, email),
    }),
    resend.emails.send({
      from: "Milo · Data by Milo <hola@databymilo.me>",
      to: email,
      subject: "la pregunta que cambió cómo hago todo análisis",
      html: followUpHtml(firstName, email),
      scheduledAt: in3Days,
    }),
  ]);

  if (welcome.status === "rejected") {
    console.error("Welcome email error:", welcome.reason);
  } else if (welcome.value?.error) {
    console.error("Welcome email Resend error:", welcome.value.error);
  }

  if (followUp.status === "rejected") {
    console.error("Follow-up email error:", followUp.reason);
  } else if (followUp.value?.error) {
    console.error("Follow-up email Resend error:", followUp.value.error);
  }

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
