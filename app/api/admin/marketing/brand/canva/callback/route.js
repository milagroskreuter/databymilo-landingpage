import { finishAuth } from "@/lib/marketing/brand/canva";

export const dynamic = "force-dynamic";

// GET ?code=&state= → Canva vuelve acá después del login.
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const back = new URL("/administracion-general/marketing/marca?tab=canva", request.url);
  try {
    if (sp.get("error")) throw new Error(sp.get("error_description") || sp.get("error"));
    await finishAuth(request, { code: sp.get("code"), state: sp.get("state") });
    back.searchParams.set("canva", "ok");
  } catch (err) {
    back.searchParams.set("canva", "error");
    back.searchParams.set("msg", String(err.message || err).slice(0, 200));
  }
  return Response.redirect(back, 302);
}
