import { getSupabaseAdmin } from "@/lib/supabase";
import { arrayBufferToBase64, downloadAsset, fail, getBrand, json } from "@/lib/marketing/brand/server";
import { checkErrorMessage, runBrandCheck } from "@/lib/marketing/brand/check";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 3.7 * 1024 * 1024; // la API acepta hasta 5 MB por imagen en base64

// GET → últimos chequeos.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("mk_brand_checks")
      .select("id, asset_id, image_name, notes, score, result, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return fail(error);
    return json({ configured: Boolean(process.env.ANTHROPIC_API_KEY), checks: data });
  } catch (err) {
    return fail(err);
  }
}

// POST { image?: "data:image/jpeg;base64,...", assetId?, name?, notes? } → checklist de coherencia.
// La imagen subida llega ya achicada desde el navegador; la de la biblioteca se lee del bucket.
export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail("Falta configurar ANTHROPIC_API_KEY en Vercel para usar el chequeo con Claude.", 400);
  }
  try {
    const { image, assetId, name, notes } = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();
    const { brand } = await getBrand(supabase);

    let piece;
    let imageName = name || null;
    if (assetId) {
      const { data: row } = await supabase.from("mk_brand_assets").select("path, name, mime, size_bytes").eq("id", assetId).single();
      if (!row) return fail("No encontré el archivo en la biblioteca", 404);
      if (!IMAGE_TYPES.includes(row.mime)) return fail("El archivo tiene que ser una imagen JPG, PNG, WEBP o GIF", 400);
      const buf = await downloadAsset(supabase, row.path);
      if (buf.byteLength > MAX_IMAGE_BYTES) return fail("La imagen pesa más de 3,7 MB. Subila desde tu compu (se achica sola).", 400);
      piece = { data: arrayBufferToBase64(buf), mediaType: row.mime };
      imageName = imageName || row.name;
    } else {
      const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(image || "");
      if (!m) return fail("Mandá una imagen JPG, PNG, WEBP o GIF", 400);
      if (m[2].length > MAX_IMAGE_BYTES * 1.37) return fail("La imagen es muy pesada", 400);
      piece = { data: m[2], mediaType: m[1] };
    }

    // Hasta 3 imágenes de referencia del moodboard.
    const references = [];
    const refIds = (brand.moodboard?.asset_ids || []).slice(0, 3);
    if (refIds.length) {
      const { data: refs } = await supabase.from("mk_brand_assets").select("path, mime, size_bytes").in("id", refIds);
      for (const r of refs || []) {
        if (!IMAGE_TYPES.includes(r.mime) || (r.size_bytes && r.size_bytes > MAX_IMAGE_BYTES)) continue;
        try {
          const buf = await downloadAsset(supabase, r.path);
          if (buf.byteLength <= MAX_IMAGE_BYTES) references.push({ data: arrayBufferToBase64(buf), mediaType: r.mime });
        } catch {
          /* se sigue sin esa referencia */
        }
      }
    }

    const { result, model } = await runBrandCheck({ brand, image: piece, references, notes: notes?.slice(0, 500) });

    const { data: saved } = await supabase
      .from("mk_brand_checks")
      .insert({ asset_id: assetId || null, image_name: imageName, notes: notes || null, score: result.score, result, model })
      .select("id, asset_id, image_name, notes, score, result, created_at")
      .single();

    return json({ check: saved || { result, score: result.score }, references: references.length });
  } catch (err) {
    const { status, message } = checkErrorMessage(err);
    return fail(message, status);
  }
}
