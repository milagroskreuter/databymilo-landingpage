import { makeUnsubToken } from "@/lib/unsub-token";
import { SITE_URL } from "@/lib/notify";

// Slugs que no se pueden usar para listas personalizadas.
export const RESERVED_SLUGS = new Set([
  "carta",
  "corpo",
  "ambas",
  "todas",
  "admin",
  "api",
  "blog",
  "recursos",
]);

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/g, "");
}

export function listUnsubUrl(email, slug) {
  return `${SITE_URL}/api/unsubscribe?e=${makeUnsubToken(email)}&l=${encodeURIComponent(slug)}`;
}

export function listPublicUrl(slug) {
  return `${SITE_URL}/listas/${slug}`;
}

export async function getLists(supabase, { onlyActive = false } = {}) {
  let query = supabase
    .from("mail_lists")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getList(supabase, slug) {
  const { data, error } = await supabase
    .from("mail_lists")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Alta en una lista que vive en Supabase (todas menos "carta").
 * @returns {"new" | "resubscribed" | "existing"}
 */
export async function subscribeToList(supabase, slug, email, firstName) {
  const { data: current } = await supabase
    .from("list_subscribers")
    .select("email, subscribed, first_name")
    .eq("list_slug", slug)
    .eq("email", email)
    .maybeSingle();

  if (current?.subscribed) return "existing";

  const { error } = await supabase.from("list_subscribers").upsert(
    {
      list_slug: slug,
      email,
      first_name: firstName || current?.first_name || null,
      subscribed: true,
      unsubscribed_at: null,
    },
    { onConflict: "list_slug,email" }
  );
  if (error) throw new Error(error.message);
  return current ? "resubscribed" : "new";
}

/** Baja de una lista de Supabase. @returns {boolean} true si cambió algo. */
export async function unsubscribeFromList(supabase, slug, email) {
  const { data, error } = await supabase
    .from("list_subscribers")
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq("list_slug", slug)
    .eq("email", email)
    .eq("subscribed", true)
    .select("email");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** Todas las filas de una lista, paginando (Supabase corta en 1000 por consulta). */
export async function fetchSubscribers(supabase, slug, { onlyActive = false } = {}) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from("list_subscribers")
      .select("email, first_name, subscribed, created_at, unsubscribed_at")
      .eq("list_slug", slug)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (onlyActive) query = query.eq("subscribed", true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
  }
  return rows;
}
