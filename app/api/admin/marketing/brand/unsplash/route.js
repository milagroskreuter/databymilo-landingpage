import { fail, json } from "@/lib/marketing/brand/server";
import { searchPhotos, unsplashConfigured } from "@/lib/marketing/brand/unsplash";

export const dynamic = "force-dynamic";

// GET ?q=&page=&orientation=portrait|landscape|squarish → búsqueda en Unsplash.
export async function GET(request) {
  if (!unsplashConfigured()) return json({ configured: false, results: [] });
  try {
    const sp = new URL(request.url).searchParams;
    const q = (sp.get("q") || "").trim().slice(0, 100);
    if (!q) return json({ configured: true, results: [] });
    const orientation = ["portrait", "landscape", "squarish"].includes(sp.get("orientation")) ? sp.get("orientation") : undefined;
    const data = await searchPhotos({ query: q, page: Math.max(1, Number(sp.get("page")) || 1), orientation });
    return json({ configured: true, ...data });
  } catch (err) {
    return fail(err, 502);
  }
}
