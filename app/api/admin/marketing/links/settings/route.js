import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidateLinks, DEFAULT_PAGE } from "@/lib/marketing/links/data";
import { jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

const SOCIAL_KEYS = ["instagram", "linkedin", "threads", "youtube", "tiktok"];
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function safeUrl(v) {
  const s = str(v, 500);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return /^https?:$/.test(u.protocol) ? u.toString() : "";
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("mk_links_settings")
      .select("value, updated_at")
      .eq("key", "page")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Response.json({ page: { ...DEFAULT_PAGE, ...(data?.value || {}) }, updated_at: data?.updated_at ?? null });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const socials = {};
    for (const k of SOCIAL_KEYS) {
      const u = safeUrl(body.socials?.[k]);
      if (u) socials[k] = u;
    }
    const page = {
      name: str(body.name, 60) || DEFAULT_PAGE.name,
      handle: str(body.handle, 60),
      bio: str(body.bio, 300),
      photo_url: safeUrl(body.photo_url),
      socials,
      footer: str(body.footer, 120),
    };
    const { error } = await getSupabaseAdmin()
      .from("mk_links_settings")
      .upsert({ key: "page", value: page, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    revalidateLinks();
    return Response.json({ page });
  } catch (err) {
    return jsonError(err);
  }
}
