import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function findFile(slug) {
  for (const ext of [".mdx", ".md"]) {
    const p = path.join(BLOG_DIR, slug + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function GET(_, { params }) {
  const { slug } = params;
  const filePath = findFile(slug);
  if (!filePath) return Response.json({ error: "No encontrado" }, { status: 404 });

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return Response.json({ slug, ...data, content });
}

export async function PUT(request, { params }) {
  const { slug } = params;
  const filePath = findFile(slug);
  if (!filePath) return Response.json({ error: "No encontrado" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { title, date, excerpt, tags, coverImage, content } = body;

  const frontmatter = { title, date, excerpt, tags: tags || [], coverImage: coverImage || null };
  const fileContent = matter.stringify(content || "", frontmatter);
  fs.writeFileSync(filePath, fileContent, "utf8");

  return Response.json({ ok: true });
}

export async function DELETE(_, { params }) {
  const { slug } = params;
  const filePath = findFile(slug);
  if (!filePath) return Response.json({ error: "No encontrado" }, { status: 404 });

  fs.unlinkSync(filePath);
  return Response.json({ ok: true });
}
