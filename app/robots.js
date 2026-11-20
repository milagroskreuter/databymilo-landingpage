export default function robots() {
  return {
    // /listas/* son páginas de suscripción para compartir por link: no se indexan.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/listas/"] }],
    sitemap: "https://databymilo.me/sitemap.xml",
  };
}
