import { getAllPosts } from "./lib/blog";

const base = "https://databymilo.me";

export default function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { url: base, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/recursos`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/blog`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/sobre`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/portfolio`, priority: 0.5, changeFrequency: "monthly" },
  ].map((r) => ({ ...r, lastModified: now }));

  const postRoutes = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: post.date ? new Date(post.date) : now,
  }));

  return [...staticRoutes, ...postRoutes];
}
