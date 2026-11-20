import { Resend } from "resend";
import { redirect } from "next/navigation";
import { parseUnsubToken } from "@/lib/unsub-token";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getList, unsubscribeFromList } from "@/lib/lists";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

const SLUG_PARAM_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function parseParams(request) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get("e");
  const rawList = searchParams.get("l");
  // Sin parámetro (o inválido) se asume La carta del domingo, como siempre.
  const list = rawList && rawList.length <= 40 && SLUG_PARAM_RE.test(rawList) ? rawList : "carta";
  const email = encoded ? parseUnsubToken(encoded) : null;
  return { list, email: email && email.includes("@") ? email : null };
}

/** Da de baja y avisa a la admin si hubo cambio. Nunca lanza. */
async function unsubscribe(email, list) {
  let changed = false;
  let listName = "La carta del domingo";

  try {
    if (list === "carta") {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Una sola consulta por email (la lista completa viene paginada de a 20)
      const { data: contact } = await resend.contacts.get({
        audienceId: AUDIENCE_ID,
        email: email.toLowerCase(),
      });

      if (contact?.id && !contact.unsubscribed) {
        await resend.contacts.update({
          id: contact.id,
          audienceId: AUDIENCE_ID,
          unsubscribed: true,
        });
        changed = true;
      }
    } else {
      const supabase = getSupabaseAdmin();
      const found = await getList(supabase, list);
      if (found) {
        listName = found.name;
        changed = await unsubscribeFromList(supabase, list, email.toLowerCase());
      }
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
  }

  // Aviso a la admin solo si realmente se dio de baja (no por clics repetidos al link).
  if (changed) {
    await notifyAdmin({
      type: "unsubscribe",
      title: `Baja: ${email}`,
      body: `Se dio de baja de ${listName}.`,
      metadata: { email, list },
    });
  }
}

// Link "Dejar de recibir" del pie del mail.
export async function GET(request) {
  const { list, email } = parseParams(request);
  if (email) await unsubscribe(email, list);
  redirect(list === "carta" ? "/desuscribirse" : `/desuscribirse?l=${list}`);
}

// Baja en un clic (RFC 8058): Gmail y Apple Mail mandan un POST a la URL de
// List-Unsubscribe cuando se toca "Anular suscripción" en el cliente de correo.
export async function POST(request) {
  const { list, email } = parseParams(request);
  if (!email) return Response.json({ error: "Link inválido" }, { status: 400 });
  await unsubscribe(email, list);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
