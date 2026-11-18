import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "content", "resources.json");

function readData() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return { free: [], paid: [] }; }
}

function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function GET() {
  const data = readData();
  return Response.json({ ...data, total: data.free.length + data.paid.length });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { slug, isPaid, ...rest } = body;
  if (!slug || !rest.title) return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });

  const data = readData();
  const list = isPaid ? data.paid : data.free;

  if (list.find((r) => r.slug === slug)) {
    return Response.json({ error: "Ya existe un recurso con ese slug" }, { status: 409 });
  }

  list.push({ slug, ...rest });
  writeData(data);
  return Response.json({ ok: true, slug });
}
