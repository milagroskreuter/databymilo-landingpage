import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/administracion-general/login")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const isAdminPage = pathname.startsWith("/administracion-general");
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const ok = await verifySessionToken(token, process.env.ADMIN_SESSION_SECRET);

    if (!ok) {
      if (isAdminApi) {
        return Response.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/administracion-general/login", request.url));
    }

    // El panel nunca debe quedar guardado en cachés compartidas ni indexado.
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/administracion-general/:path*", "/api/admin/:path*"],
};
