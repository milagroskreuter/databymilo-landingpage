import { getAllPosts } from "../../lib/blog";

const BASE = "https://databymilo.me";

function escape(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${post.slug}</guid>
      <pubDate>${post.date ? new Date(post.date).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      ${post.tags.map((t) => `<category>${escape(t)}</category>`).join("")}
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Data by Milo · Blog</title>
    <link>${BASE}</link>
    <description>Historias largas, explicaciones y data traducida al español. Casos reales, errores incluidos.</description>
    <language>es-AR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>databymilo@gmail.com (Milo)</managingEditor>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
