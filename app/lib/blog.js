import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function ensureDir() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
}

export function getAllPosts() {
  ensureDir();
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  const posts = files.map((filename) => {
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
      content,
    };
  });
  return posts.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
}

export function getPostBySlug(slug) {
  ensureDir();
  const exts = [".mdx", ".md"];
  for (const ext of exts) {
    const filePath = path.join(BLOG_DIR, slug + ext);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        date: data.date || null,
        excerpt: data.excerpt || "",
        tags: data.tags || [],
        coverImage: data.coverImage || null,
        content,
      };
    }
  }
  return null;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}
