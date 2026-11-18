export const dynamic = "force-dynamic";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return Response.json({ error: "Config faltante" }, { status: 500 });
  }

  const response = Response.json({ ok: true, redirect: "/administracion-general" });
  response.headers.set(
    "Set-Cookie",
    `admin_token=${secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    "admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
  return response;
}
