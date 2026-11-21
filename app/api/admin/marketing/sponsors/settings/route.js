import { getSupabaseAdmin } from "@/lib/supabase";
import { refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { MEDIA_KIT_KEY, mergeMediaKit, DEFAULT_MEDIA_KIT } from "@/lib/marketing/sponsors/mediaKitDefaults";

export const dynamic = "force-dynamic";

const str = (v, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v, fn, max = 12) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : []);
const titleDesc = (x) => {
  const title = str(x?.title, 120);
  return title ? { title, desc: str(x?.desc, 400) } : null;
};

function clean(body) {
  const show = {};
  for (const k of Object.keys(DEFAULT_MEDIA_KIT.show)) show[k] = Boolean(body?.show?.[k]);
  const booking = str(body.booking_url, 400);
  return {
    hero_title: str(body.hero_title, 160),
    hero_sub: str(body.hero_sub, 500),
    about: str(body.about, 2000),
    topics: list(body.topics, titleDesc),
    audience_text: str(body.audience_text, 800),
    audience_points: list(body.audience_points, (x) => str(x, 200) || null),
    collab_formats: list(body.collab_formats, titleDesc),
    rates_note: str(body.rates_note, 300),
    brands_extra: list(body.brands_extra, (x) => str(x, 80) || null, 40),
    contact_email: str(body.contact_email, 200),
    contact_text: str(body.contact_text, 500),
    contact_cta: str(body.contact_cta, 40),
    booking_url: /^https?:\/\//i.test(booking) ? booking : "",
    networks: list(body.networks, (x) => str(x, 30) || null, 10),
    show,
    indexable: Boolean(body.indexable),
  };
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("mk_sponsors_settings")
      .select("value")
      .eq("key", MEDIA_KIT_KEY)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ settings: mergeMediaKit(data?.value) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const value = clean(body || {});
    const { error } = await getSupabaseAdmin()
      .from("mk_sponsors_settings")
      .upsert({ key: MEDIA_KIT_KEY, value, updated_at: new Date().toISOString() });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    refreshMediaKit();
    return Response.json({ settings: mergeMediaKit(value) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
