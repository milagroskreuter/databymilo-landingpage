import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, {
    global: { fetch: (u, opts) => fetch(u, { ...opts, cache: "no-store" }) },
  });
}

function toResource(r) {
  return {
    slug: r.slug,
    title: r.title,
    type: r.type || "",
    pages: r.pages || "",
    desc: r.description || "",
    color: r.color || "#fadbe8",
    href: r.href || "",
    price: r.price || "",
    priceNote: r.price_note || "",
    paymentUrl: r.payment_url || "",
    badge: r.badge || "",
    forWho: r.for_who || "",
    note: r.note || "",
    bullets: r.bullets || [],
    isPaid: r.is_paid || false,
  };
}

export async function getResources() {
  const supabase = getClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("is_paid", false)
    .order("sort_order", { ascending: true });
  return (data || []).map(toResource);
}

export async function getPaidResources() {
  const supabase = getClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("is_paid", true)
    .order("sort_order", { ascending: true });
  return (data || []).map(toResource);
}

export async function getResourceBySlug(slug) {
  const supabase = getClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ? toResource(data) : null;
}

export async function getAvailableResources() {
  const all = await getResources();
  return all.filter((r) => r.href);
}
