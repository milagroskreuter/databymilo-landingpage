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

export async function GET(_, { params }) {
  const { slug } = params;
  const { free, paid } = readData();
  const resource = [...free, ...paid].find((r) => r.slug === slug);
  if (!resource) return Response.json({ error: "No encontrado" }, { status: 404 });
  const isPaid = paid.some((r) => r.slug === slug);
  return Response.json({ ...resource, isPaid });
}

export async function PUT(request, { params }) {
  const { slug } = params;
  const body = await request.json().catch(() => ({}));
  const { isPaid, ...rest } = body;

  const data = readData();
  const listKey = isPaid ? "paid" : "free";
  const otherKey = isPaid ? "free" : "paid";

  // Remove from both lists in case type changed
  data.free = data.free.filter((r) => r.slug !== slug);
  data.paid = data.paid.filter((r) => r.slug !== slug);

  data[listKey].push({ slug, ...rest });
  writeData(data);
  return Response.json({ ok: true });
}

export async function DELETE(_, { params }) {
  const { slug } = params;
  const data = readData();
  const before = data.free.length + data.paid.length;
  data.free = data.free.filter((r) => r.slug !== slug);
  data.paid = data.paid.filter((r) => r.slug !== slug);
  if (data.free.length + data.paid.length === before) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  writeData(data);
  return Response.json({ ok: true });
}
