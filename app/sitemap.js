import { getAllPosts } from "./lib/blog";
import { getAvailableResources } from "./lib/resources";

const base = "https://databymilo.me";

export default async function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { url: base, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/recursos`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/blog`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/sobre`, priority: 0.7, changeFrequency: "monthly" },
  ].map((r) => ({ ...r, lastModified: now }));

  const postRoutes = (await getAllPosts().catch(() => [])).map((post) => ({
    url: `${base}/blog/${post.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: post.date ? new Date(post.date) : now,
  }));

  const resourceRoutes = (await getAvailableResources().catch(() => [])).map((resource) => ({
    url: `${base}/recursos/${resource.slug}`,
    priority: 0.8,
    changeFrequency: "monthly",
    lastModified: now,
  }));

  return [...staticRoutes, ...postRoutes, ...resourceRoutes];
}
