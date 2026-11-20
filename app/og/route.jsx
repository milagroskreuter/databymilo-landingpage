import { renderOg, titleSizeFor } from "@/lib/og/template";

export const runtime = "edge";

// Imagen para compartir de cada página: /og?title=...&type=blog
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Data by Milo").slice(0, 120);
  const type = (searchParams.get("type") ?? "").slice(0, 30);

  return renderOg({ eyebrow: type, title, titleSize: titleSizeFor(title) });
}
