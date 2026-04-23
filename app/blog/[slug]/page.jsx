import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import CTABlock from "../../components/sections/CTABlock";
import Footer from "../../components/sections/Footer";
import SectionDivider from "../../components/SectionDivider";
import TypeEyebrow from "../../components/primitives/TypeEyebrow";
import ShareButtons from "../../components/ShareButtons";
import { getAllPosts, getPostBySlug, getRelatedPosts, formatDate } from "../../lib/blog";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://databymilo.me/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} | Data by Milo`,
      description: post.excerpt,
      url: `https://databymilo.me/blog/${post.slug}`,
      publishedTime: post.date || undefined,
      tags: post.tags,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${post.title} | Data by Milo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/opengraph-image"],
    },
  };
}

const mdxComponents = {
  h2: (props) => (
    <h2
      {...props}
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "clamp(26px, 3vw, 32px)",
        color: "var(--vino)",
        marginTop: 48,
        marginBottom: 16,
        lineHeight: 1.25,
      }}
    />
  ),
  h3: (props) => (
    <h3
      {...props}
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "clamp(20px, 2.2vw, 24px)",
        color: "var(--ink)",
        marginTop: 32,
        marginBottom: 12,
        lineHeight: 1.3,
      }}
    />
  ),
  p: (props) => (
    <p
      {...props}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 17,
        lineHeight: 1.75,
        color: "var(--ink)",
        margin: "0 0 20px",
      }}
    />
  ),
  ul: (props) => (
    <ul
      {...props}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 17,
        lineHeight: 1.75,
        color: "var(--ink)",
        margin: "0 0 20px",
        paddingLeft: 24,
      }}
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 17,
        lineHeight: 1.75,
        color: "var(--ink)",
        margin: "0 0 20px",
        paddingLeft: 24,
      }}
    />
  ),
  li: (props) => <li {...props} style={{ marginBottom: 6 }} />,
  a: (props) => (
    <a
      {...props}
      style={{ color: "var(--vino)", textDecoration: "underline", textUnderlineOffset: 3 }}
    />
  ),
  blockquote: (props) => (
    <blockquote
      {...props}
      style={{
        borderLeft: "3px solid var(--rosa)",
        paddingLeft: 20,
        margin: "24px 0",
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: 18,
        color: "var(--fg-2)",
      }}
    />
  ),
  code: (props) => (
    <code
      {...props}
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.9em",
        background: "var(--rosa-50)",
        padding: "2px 6px",
        borderRadius: 4,
        color: "var(--vino)",
      }}
    />
  ),
  pre: (props) => (
    <pre
      {...props}
      style={{
        background: "#2a1520",
        color: "var(--cream)",
        padding: 20,
        borderRadius: 10,
        overflowX: "auto",
        fontSize: 14,
        lineHeight: 1.6,
        margin: "20px 0",
      }}
    />
  ),
};

function Signature() {
  return (
    <div
      style={{
        marginTop: 56,
        fontFamily: "var(--font-accent)",
        fontSize: 40,
        color: "var(--vino)",
        textAlign: "right",
        lineHeight: 1,
      }}
    >
      milo
    </div>
  );
}

function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) return null;
  return (
    <aside style={{ marginTop: 72 }}>
      <div
        className="eyebrow-j"
        style={{ color: "var(--vino)", marginBottom: 18 }}
      >
        Seguir leyendo
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
        }}
      >
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{ textDecoration: "none" }}
          >
            <article
              style={{
                background: "var(--cream)",
                borderRadius: 12,
                padding: "22px 20px",
                border: "1px solid rgba(139,26,74,.12)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--vino)",
                  opacity: 0.7,
                }}
              >
                Entrada Nº {post.entradaStr}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {post.title}
              </h3>
              {post.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                  {post.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--vino)",
                        background: "var(--rosa-50)",
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function PostJsonLd({ post }) {
  const base = "https://databymilo.me";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${base}/blog/${post.slug}`,
        url: `${base}/blog/${post.slug}`,
        headline: post.title,
        description: post.excerpt || undefined,
        datePublished: post.date || undefined,
        dateModified: post.date || undefined,
        inLanguage: "es",
        keywords: post.tags.length ? post.tags.join(", ") : undefined,
        author: {
          "@type": "Person",
          "@id": `${base}/#person`,
          name: "Milo",
          url: base,
        },
        publisher: { "@id": `${base}/#person` },
        isPartOf: { "@id": `${base}/#website` },
        image: {
          "@type": "ImageObject",
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: base },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${base}/blog/${post.slug}` },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const related = getRelatedPosts(post.slug, 3);
  const pagenum = String(post.entrada * 4).padStart(2, "0");

  return (
    <>
      <PostJsonLd post={post} />
      <main>
        <div className="journal">
          <article className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
            <Link
              href="/blog"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--vino)",
                textDecoration: "none",
                marginBottom: 32,
              }}
            >
              ← Volver al blog
            </Link>
            <div className="section-head">
              <TypeEyebrow className="eyebrow-j">Entrada Nº {post.entradaStr}</TypeEyebrow>
              <div className="rule"></div>
              <div className="pagenum">pág. {pagenum}</div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 16, marginBottom: 12, flexWrap: "wrap" }}>
              {post.date && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)" }}>
                  {formatDate(post.date)}
                </div>
              )}
              {post.readingTime && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)" }}>
                  · {post.readingTime}
                </div>
              )}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(36px, 5vw, 52px)",
                color: "var(--ink)",
                margin: "0 0 20px",
                lineHeight: 1.1,
              }}
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 20,
                  color: "var(--fg-2)",
                  lineHeight: 1.55,
                  margin: "0 0 48px",
                  borderBottom: "1px dashed rgba(139,26,74,.2)",
                  paddingBottom: 24,
                }}
              >
                {post.excerpt}
              </p>
            )}
            <div>
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>
            <Signature />
            <ShareButtons slug={post.slug} title={post.title} />
            <RelatedPosts posts={related} />
          </article>
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
