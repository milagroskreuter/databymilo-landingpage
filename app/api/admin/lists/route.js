import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listAllContacts } from "@/lib/resend-contacts";
import { getLists, fetchSubscribers, listPublicUrl, slugify, SLUG_RE, RESERVED_SLUGS } from "@/lib/lists";

export const dynamic = "force-dynamic";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "5d28eac4-182a-4bc6-9a9a-5d2a7028ea89";

async function countList(supabase, slug) {
  const base = () =>
    supabase.from("list_subscribers").select("email", { count: "exact", head: true }).eq("list_slug", slug);
  const [total, active] = await Promise.all([base(), base().eq("subscribed", true)]);
  // OJO: "active" ya es una columna de la lista (acepta suscripciones), por eso el conteo se llama activeCount
  return { total: total.count ?? 0, activeCount: active.count ?? 0 };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    const lists = await getLists(supabase);

    // ?names=1 → solo las listas, sin contar suscriptoras (no consulta Resend)
    if (new URL(request.url).searchParams.get("names")) {
      return Response.json({ lists });
    }

    // La carta del domingo vive en Resend
    let cartaActive = null; // Set de emails activos, o null si Resend no respondió
    let cartaTotal = null;
    if (lists.some((l) => l.source === "resend")) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const contacts = await listAllContacts(resend, AUDIENCE_ID);
        cartaTotal = contacts.length;
        cartaActive = new Set(contacts.filter((c) => !c.unsubscribed).map((c) => c.email.toLowerCase()));
      } catch (err) {
        console.error("lists: no se pudo leer Resend:", err.message);
      }
    }

    const out = [];
    for (const l of lists) {
      const counts =
        l.source === "resend"
          ? { total: cartaTotal, activeCount: cartaActive ? cartaActive.size : null }
          : await countList(supabase, l.slug);
      out.push({ ...l, ...counts, publicUrl: listPublicUrl(l.slug) });
    }

    // Cuántas personas están activas en La carta Y en Edición Corpo
    let both = null;
    if (cartaActive) {
      const corpo = await fetchSubscribers(supabase, "corpo", { onlyActive: true });
      both = corpo.filter((r) => cartaActive.has(r.email.toLowerCase())).length;
    }

    return Response.json({ lists: out, both });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return Response.json({ error: "Poné un nombre (hasta 80 caracteres)" }, { status: 400 });
    }

    const slug = slugify(body.slug || name);
    if (!slug || !SLUG_RE.test(slug)) {
      return Response.json({ error: "El link solo puede tener letras, números y guiones" }, { status: 400 });
    }
    if (RESERVED_SLUGS.has(slug)) {
      return Response.json({ error: `"${slug}" está reservado, elegí otro link` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: last } = await supabase
      .from("mail_lists")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("mail_lists")
      .insert({
        slug,
        name,
        description: typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : null,
        button_label: typeof body.button_label === "string" ? body.button_label.trim().slice(0, 30) || null : null,
        kind: "custom",
        source: "supabase",
        active: true,
        sort_order: Math.max(100, (last?.sort_order ?? 0) + 1),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Ya existe una lista con ese link" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ list: { ...data, publicUrl: listPublicUrl(data.slug) } }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
