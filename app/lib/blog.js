import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
// Home page is Entrada Nº 001; blog posts continue from 002.
const HOME_ENTRADA = 1;

function ensureDir() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
}

function calcReadingTime(content) {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min de lectura`;
}

function parsePost(filename) {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    date: data.date || null,
    excerpt: data.excerpt || "",
    tags: data.tags || [],
    coverImage: data.coverImage || null,
    readingTime: calcReadingTime(content),
    content,
  };
}

function compareDateAsc(a, b) {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(a.date) - new Date(b.date);
}

function withEntrada(posts) {
  // posts expected sorted ASC by date; oldest gets lowest entrada number
  return posts.map((p, i) => {
    const entrada = HOME_ENTRADA + 1 + i; // 002, 003, ...
    return { ...p, entrada, entradaStr: String(entrada).padStart(3, "0") };
  });
}

export function getAllPosts() {
  ensureDir();
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  const ascending = files.map(parsePost).sort(compareDateAsc);
  const numbered = withEntrada(ascending);
  // Display order: newest first
  return numbered.slice().reverse();
}

export function getPostBySlug(slug) {
  const all = getAllPosts();
  return all.find((p) => p.slug === slug) || null;
}

export function getRelatedPosts(slug, limit = 3) {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const currentTags = new Set(current.tags);

  const scored = all
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      ...p,
      _score: p.tags.filter((t) => currentTags.has(t)).length,
    }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

  return scored.slice(0, limit).map(({ _score, ...rest }) => rest);
}

export function getAllTags() {
  const all = getAllPosts();
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
