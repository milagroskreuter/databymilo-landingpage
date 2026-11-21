import { getSupabaseAdmin } from "@/lib/supabase";
import { ASSET_BUCKET, fail, json, newAssetPath } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

// POST { name, size } → URL firmada para subir directo al bucket (sin pasar por el
// servidor, así no aplica el límite de 4,5 MB del cuerpo de las funciones de Vercel).
export async function POST(request) {
  try {
    const { name, size } = await request.json().catch(() => ({}));
    if (!name) return fail("Falta el nombre del archivo", 400);
    if (size && size > MAX_BYTES) return fail("El archivo supera los 50 MB", 400);
    const supabase = getSupabaseAdmin();
    const path = newAssetPath("uploads", name);
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).createSignedUploadUrl(path);
    if (error) return fail(error);
    return json({ path, signedUrl: data.signedUrl });
  } catch (err) {
    return fail(err);
  }
}
