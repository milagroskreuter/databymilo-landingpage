import { createClient } from "@supabase/supabase-js";

const HOME_ENTRADA = 1;

function getClient() {
  const url = process.env.SUPABASE_URL;
  // Use service key server-side (bypasses RLS); fall back to anon for reads
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function calcReadingTime(content) {
  if (!content) return "";
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min de lectura`;
}

function withEntrada(posts) {
  // posts sorted ASC by date; oldest gets lowest entrada number
  return posts.map((p, i) => {
    const entrada = HOME_ENTRADA + 1 + i;
    return { ...p, entrada, entradaStr: String(entrada).padStart(3, "0") };
  });
}

export async function getAllPosts() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, date, excerpt, tags, cover_image, content, published")
    .eq("published", true)
    .order("date", { ascending: true });

  if (error || !data) return [];

  const numbered = withEntrada(data.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt || "",
    tags: p.tags || [],
    coverImage: p.cover_image || null,
    readingTime: calcReadingTime(p.content),
    content: p.content || "",
  })));

  return numbered.slice().reverse(); // newest first
}

export async function getPostBySlug(slug) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;

  const all = await getAllPosts();
  const withNum = all.find((p) => p.slug === slug);

  return {
    slug: data.slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt || "",
    tags: data.tags || [],
    coverImage: data.cover_image || null,
    readingTime: calcReadingTime(data.content),
    content: data.content || "",
    entrada: withNum?.entrada ?? 2,
    entradaStr: withNum?.entradaStr ?? "002",
  };
}

export async function getRelatedPosts(slug, limit = 3) {
  const all = await getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const currentTags = new Set(current.tags);

  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({ ...p, _score: p.tags.filter((t) => currentTags.has(t)).length }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);
}

export async function getAllTags() {
  const all = await getAllPosts();
  const counts = {};
  for (const p of all) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}
