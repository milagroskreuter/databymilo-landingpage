import { getSupabaseAdmin } from "@/lib/supabase";
import { BRAND_KEYS } from "@/lib/marketing/brand/defaults";
import { getBrand, json, fail } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

// GET → sistema de marca completo { brand: { palette, typography, voice, rules, bios, moodboard, logo, references } }
export async function GET() {
  try {
    return json(await getBrand());
  } catch (err) {
    return fail(err);
  }
}

// PUT { key, value } → guarda una clave del sistema de marca.
export async function PUT(request) {
  try {
    const { key, value } = await request.json().catch(() => ({}));
    if (!BRAND_KEYS.includes(key)) return fail("Clave de marca desconocida", 400);
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail("El valor tiene que ser un objeto", 400);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("mk_brand")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return fail(error);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
