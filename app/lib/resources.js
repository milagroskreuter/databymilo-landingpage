import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sin credenciales (ej. build local) se devuelve null y las páginas muestran
  // la lista vacía en vez de romper con un error 500.
  if (!url || !key) {
    console.error("resources: faltan SUPABASE_URL / SUPABASE_SERVICE_KEY");
    return null;
  }
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

export const getResources = cache(async function getResources() {
  const supabase = getClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("is_paid", false)
    .order("sort_order", { ascending: true });
  return (data || []).map(toResource);
});

export async function getPaidResources() {
  const supabase = getClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("is_paid", true)
    .order("sort_order", { ascending: true });
  return (data || []).map(toResource);
}

export const getResourceBySlug = cache(async function getResourceBySlug(slug) {
  const supabase = getClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? toResource(data) : null;
});

export async function getAvailableResources() {
  const all = await getResources();
  return all.filter((r) => r.href);
}
