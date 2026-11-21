import { getSupabaseAdmin } from "@/lib/supabase";
import { fail, json, saveAsset } from "@/lib/marketing/brand/server";
import { getPhoto, shapePhoto, trackDownload, unsplashConfigured } from "@/lib/marketing/brand/unsplash";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST { id, tags? } → descarga la foto (disparando el registro de Unsplash) y la guarda en la biblioteca.
export async function POST(request) {
  if (!unsplashConfigured()) return fail("Falta configurar UNSPLASH_ACCESS_KEY", 400);
  try {
    const { id, tags } = await request.json().catch(() => ({}));
    if (!id) return fail("Falta el id de la foto", 400);

    // Los datos se piden de nuevo a Unsplash: no se confía en URLs que mande el navegador.
    const photo = await getPhoto(id);
    await trackDownload(photo);

    const src = new URL(photo.urls.raw);
    src.searchParams.set("w", "2160");
    src.searchParams.set("fm", "jpg");
    src.searchParams.set("q", "85");
    const res = await fetch(src.toString(), { cache: "no-store" });
    if (!res.ok) return fail(`No se pudo descargar la foto (${res.status})`, 502);
    const body = await res.arrayBuffer();

    const p = shapePhoto(photo);
    const ratio = photo.height / photo.width;
    const asset = await saveAsset(getSupabaseAdmin(), {
      folder: "unsplash",
      name: `${(p.alt || "foto").slice(0, 60)} · ${p.author}.jpg`,
      body,
      mime: "image/jpeg",
      width: 2160,
      height: Math.round(2160 * ratio),
      tags: ["foto", "unsplash", ...(Array.isArray(tags) ? tags : [])],
      source: "unsplash",
      meta: {
        unsplash_id: photo.id,
        author: p.author,
        author_url: p.authorUrl,
        photo_url: p.photoUrl,
        attribution: `Foto de ${p.author} en Unsplash`,
        alt: p.alt,
      },
    });
    return json({ asset }, 201);
  } catch (err) {
    return fail(err);
  }
}
