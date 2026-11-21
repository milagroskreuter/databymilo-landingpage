import { canvaConfigured, startAuth } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";

const BACK = "/administracion-general/marketing/marca?tab=canva";

// GET → redirige al login de Canva.
export async function GET(request) {
  if (!canvaConfigured()) return Response.redirect(new URL(`${BACK}&canva=sin-config`, request.url), 302);
  try {
    return Response.redirect(await startAuth(request), 302);
  } catch (err) {
    const back = new URL(BACK, request.url);
    back.searchParams.set("canva", "error");
    back.searchParams.set("msg", String(err.message || err).slice(0, 200));
    return Response.redirect(back, 302);
  }
}
