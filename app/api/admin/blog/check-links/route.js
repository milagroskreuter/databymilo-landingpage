import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function extractLinks(content) {
  const urlRe = /\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g;
  const links = [];
  let m;
  while ((m = urlRe.exec(content)) !== null) {
    links.push({ text: m[1], url: m[2] });
  }
  return links;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: posts } = await supabase.from("blog_posts").select("slug, title, content").eq("published", true);
  if (!posts) return Response.json({ results: [] });

  const allLinks = [];
  for (const post of posts) {
    for (const link of extractLinks(post.content || "")) {
      allLinks.push({ post_slug: post.slug, post_title: post.title, ...link });
    }
  }

  // Check each unique URL (cap at 50 to avoid timeouts)
  const uniqueUrls = [...new Set(allLinks.map(l => l.url))].slice(0, 50);
  const results = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
        clearTimeout(timeout);
        return { url, status: res.status, ok: res.ok };
      } catch (err) {
        return { url, status: null, ok: false, error: err.message };
      }
    })
  );

  const statusMap = {};
  results.forEach((r, i) => {
    statusMap[uniqueUrls[i]] = r.status === "fulfilled" ? r.value : { url: uniqueUrls[i], ok: false, error: "Failed" };
  });

  const broken = allLinks
    .map(l => ({ ...l, ...statusMap[l.url] }))
    .filter(l => !l.ok);

  return Response.json({ total: allLinks.length, broken, checkedUrls: uniqueUrls.length });
}
