import { NextResponse } from "next/server";

// Comparación en tiempo constante (el runtime edge no trae timingSafeEqual).
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/administracion-general/login")) return NextResponse.next();

  const isAdminPage = pathname.startsWith("/administracion-general");
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!token || !secret || !safeEqual(token, secret)) {
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
