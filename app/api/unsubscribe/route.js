import { Resend } from "resend";
import { redirect } from "next/navigation";
import { parseUnsubToken } from "@/lib/unsub-token";
import { getSupabaseAdmin } from "@/lib/supabase";
import { unsubscribeCorpo, LISTS } from "@/lib/corpo";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get("e");
  const list = searchParams.get("l") === "corpo" ? "corpo" : "carta";
  const confirmation = list === "corpo" ? "/desuscribirse?l=corpo" : "/desuscribirse";

  if (!encoded) {
    redirect(confirmation);
  }

  const email = parseUnsubToken(encoded);

  if (!email || !email.includes("@")) {
    redirect(confirmation);
  }

  let changed = false;

  try {
    if (list === "corpo") {
      changed = await unsubscribeCorpo(getSupabaseAdmin(), email.toLowerCase());
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Find contact by email in the audience
      const { data: contacts } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
      const contact = contacts?.data?.find((c) => c.email === email.toLowerCase());

      if (contact && !contact.unsubscribed) {
        await resend.contacts.update({
          id: contact.id,
          audienceId: AUDIENCE_ID,
          unsubscribed: true,
        });
        changed = true;
      }
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
    // Still redirect to confirmation page even if the backend fails
  }

  // Aviso a la admin solo si realmente se dio de baja (no por clics repetidos al link).
  if (changed) {
    await notifyAdmin({
      type: "unsubscribe",
      title: `Baja: ${email}`,
      body: `Se dio de baja de ${LISTS[list]}.`,
      metadata: { email, list },
    });
  }

  redirect(confirmation);
}
