import { rateLimit, getIp } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/notify";
import {
  PUBLIC_BUCKET,
  cleanLine,
  cleanText,
  cleanUrl,
  cleanSlugs,
  uploadImage,
  removeFiles,
} from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function bad(error, status = 400) {
  return Response.json({ error }, { status, headers: NO_STORE });
}

export async function POST(request) {
  const { ok } = rateLimit(`testimonial:${getIp(request)}`, { max: 3, windowMs: 10 * 60_000 });
  if (!ok) return bad("Mandaste varios seguidos. Probá de nuevo en un rato.", 429);

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) return bad("Bad request");

  let form;
  try {
    form = await request.formData();
  } catch {
    return bad("Bad request");
  }

  // Honeypot: un campo oculto que una persona nunca completa. Si viene lleno,
  // se responde como si todo hubiera salido bien para no darle pistas al bot.
  if (cleanLine(form.get("website") ?? "", 200)) {
    return Response.json({ ok: true }, { headers: NO_STORE });
  }
  // Envíos instantáneos (menos de 3 s desde que cargó el formulario): también bots.
  const started = Number(form.get("started"));
  if (Number.isFinite(started) && started > 0 && Date.now() - started < 3000) {
    return Response.json({ ok: true }, { headers: NO_STORE });
  }

  const name = cleanLine(form.get("name") ?? "", 80).replace(/https?:\/\/\S+/gi, "").trim();
  const relation = cleanLine(form.get("relation") ?? "", 140);
  const text = cleanText(form.get("text") ?? "", 1500);
  const rawSocial = form.get("social_url") ?? "";
  const socialUrl = cleanUrl(rawSocial);
  const consent = ["on", "true", "1", "si"].includes(String(form.get("consent") ?? "").toLowerCase());
  const products = cleanSlugs(form.get("product") ?? "", 1);

  if (name.length < 2) return bad("Contame tu nombre");
  if (text.length < 15) return bad("El testimonio es muy corto (mínimo 15 caracteres)");
  if (!consent) return bad("Necesito tu permiso para publicarlo");
  if (cleanLine(rawSocial) && !socialUrl) return bad("El link a tu red no parece válido");

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("testimonials:", err.message);
    return bad("No se pudo guardar. Probá más tarde.", 500);
  }

  let photoPath = null;
  try {
    photoPath = await uploadImage(supabase, form.get("photo"), {
      bucket: PUBLIC_BUCKET,
      folder: "testimonials",
      maxBytes: MAX_PHOTO_BYTES,
    });
  } catch (err) {
    return bad(err.message);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("mk_community_testimonials")
    .insert({
      name,
      relation: relation || null,
      text,
      original_text: text,
      photo_path: photoPath,
      social_url: socialUrl || null,
      consent: true,
      consent_at: now,
      products,
      status: "pending",
      source: "form",
    })
    .select("id")
    .single();

  if (error) {
    console.error("testimonials insert:", error.message);
    await removeFiles(supabase, PUBLIC_BUCKET, [photoPath]);
    return bad("No se pudo guardar. Probá más tarde.", 500);
  }

  const excerpt = text.length > 220 ? `${text.slice(0, 220)}…` : text;
  await notifyAdmin({
    type: "testimonial",
    title: `Nuevo testimonio de ${name}`,
    body: `${relation ? `${relation}\n\n` : ""}“${excerpt}”\n\nQueda pendiente hasta que lo apruebes en Marketing → Comunidad.`,
    metadata: {
      testimonial_id: data.id,
      href: "/administracion-general/marketing/comunidad?tab=testimonios",
    },
  });

  return Response.json({ ok: true }, { status: 201, headers: NO_STORE });
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
