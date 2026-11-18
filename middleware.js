import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/administracion-general/login")) return NextResponse.next();

  const isAdminPage = pathname.startsWith("/administracion-general");
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!token || !secret || token !== secret) {
      if (isAdminApi) {
        return Response.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/administracion-general/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/administracion-general/:path*", "/api/admin/:path*"],
};
