export default function robots() {
  return {
    // /listas/* son páginas de suscripción para compartir por link: no se indexan.
    // El panel y la API tampoco tienen nada para buscadores.
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/listas/", "/administracion-general", "/api/", "/desuscribirse"],
      },
    ],
    sitemap: "https://databymilo.me/sitemap.xml",
  };
}
