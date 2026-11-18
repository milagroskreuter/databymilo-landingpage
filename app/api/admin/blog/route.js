import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function ensureDir() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
}

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function GET() {
  ensureDir();
  const files = fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));
  const posts = files.map((f) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf8");
    const { data } = matter(raw);
    return {
      slug: f.replace(/\.mdx?$/, ""),
      title: data.title || f,
      date: data.date || null,
      excerpt: data.excerpt || "",
      tags: data.tags || [],
      coverImage: data.coverImage || null,
    };
  }).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  return Response.json({ posts, total: posts.length });
}

export async function POST(request) {
  ensureDir();
  const { title, date, excerpt, tags, coverImage, content, slug: customSlug } = await request.json().catch(() => ({}));
  if (!title) return Response.json({ error: "Falta título" }, { status: 400 });

  const slug = customSlug || slugify(title);
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (fs.existsSync(filePath)) {
    return Response.json({ error: "Ya existe un post con ese slug" }, { status: 409 });
  }

  const frontmatter = { title, date: date || new Date().toISOString().split("T")[0], excerpt: excerpt || "", tags: tags || [], coverImage: coverImage || null };
  const fileContent = matter.stringify(content || "", frontmatter);
  fs.writeFileSync(filePath, fileContent, "utf8");

  return Response.json({ ok: true, slug });
}
