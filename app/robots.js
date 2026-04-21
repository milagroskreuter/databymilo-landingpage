export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://databymilo.me/sitemap.xml",
  };
}
