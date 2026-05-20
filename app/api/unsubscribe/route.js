import { Resend } from "resend";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get("e");

  if (!encoded) {
    redirect("/desuscribirse");
  }

  let email;
  try {
    email = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    redirect("/desuscribirse");
  }

  // Basic sanity check
  if (!email || !email.includes("@")) {
    redirect("/desuscribirse");
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Find contact by email in the audience
    const { data: contacts } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const contact = contacts?.data?.find((c) => c.email === email.toLowerCase());

    if (contact) {
      await resend.contacts.update({
        id: contact.id,
        audienceId: AUDIENCE_ID,
        unsubscribed: true,
      });
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
    // Still redirect to confirmation page even if Resend fails
  }

  redirect("/desuscribirse");
}
