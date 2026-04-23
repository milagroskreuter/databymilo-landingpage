const base = "https://databymilo.me";

export default function sitemap() {
  const now = new Date();
  const routes = [
    { url: base, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/recursos`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/blog`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/sobre`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/portfolio`, priority: 0.5, changeFrequency: "monthly" },
  ];
  return routes.map((r) => ({ ...r, lastModified: now }));
}
