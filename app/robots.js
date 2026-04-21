export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://databymilo.com/sitemap.xml",
  };
}
