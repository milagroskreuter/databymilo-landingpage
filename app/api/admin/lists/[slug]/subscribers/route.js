import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getList, fetchSubscribers } from "@/lib/lists";
import { listAllContacts } from "@/lib/resend-contacts";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;

// Suscriptoras de una lista que vive en Supabase (todas menos "carta",
// que se gestiona desde /api/admin/newsletter/contacts).

async function loadList(supabase, slug) {
  const list = await getList(supabase, slug);
  if (!list) return { error: Response.json({ error: "Lista no encontrada" }, { status: 404 }) };
  if (list.source === "resend") {
    return { error: Response.json({ error: "Esta lista se gestiona desde Suscriptoras" }, { status: 400 }) };
  }
  return { list };
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const { list, error } = await loadList(supabase, params.slug);
    if (error) return error;

    const rows = await fetchSubscribers(supabase, params.slug);

    // Para Edición Corpo: marcar quién también está activa en La carta del domingo
    let cartaActive = null;
    if (params.slug === "corpo") {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const contacts = await listAllContacts(resend, AUDIENCE_ID);
        cartaActive = new Set(contacts.filter((c) => !c.unsubscribed).map((c) => c.email.toLowerCase()));
      } catch (err) {
        console.error("subscribers: no se pudo leer Resend:", err.message);
      }
    }

    const subscribers = rows.map((r) => ({
      ...r,
      inBoth: !!cartaActive && r.subscribed && cartaActive.has(r.email.toLowerCase()),
    }));

    return Response.json({
      list,
      subscribers,
      total: subscribers.length,
      active: subscribers.filter((s) => s.subscribed).length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Alta manual desde el admin
export async function POST(request, { params }) {
  try {
    const { email, firstName } = await request.json().catch(() => ({}));
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(clean)) return Response.json({ error: "Email inválido" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await loadList(supabase, params.slug);
    if (error) return error;

    const { error: upsertError } = await supabase.from("list_subscribers").upsert(
      {
        list_slug: params.slug,
        email: clean,
        first_name: typeof firstName === "string" ? firstName.trim().slice(0, 80) || null : null,
        subscribed: true,
        unsubscribed_at: null,
      },
      { onConflict: "list_slug,email" }
    );
    if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Activar / desactivar a una suscriptora
export async function PATCH(request, { params }) {
  try {
    const { email, subscribed } = await request.json().catch(() => ({}));
    if (!email || typeof subscribed !== "boolean") {
      return Response.json({ error: "Faltan email o subscribed" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await loadList(supabase, params.slug);
    if (error) return error;

    const { error: updateError } = await supabase
      .from("list_subscribers")
      .update({ subscribed, unsubscribed_at: subscribed ? null : new Date().toISOString() })
      .eq("list_slug", params.slug)
      .eq("email", email);
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { email } = await request.json().catch(() => ({}));
    if (!email) return Response.json({ error: "Falta email" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error } = await loadList(supabase, params.slug);
    if (error) return error;

    const { error: deleteError } = await supabase
      .from("list_subscribers")
      .delete()
      .eq("list_slug", params.slug)
      .eq("email", email);
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
