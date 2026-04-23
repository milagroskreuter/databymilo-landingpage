import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import CTABlock from "../../components/sections/CTABlock";
import Footer from "../../components/sections/Footer";
import SectionDivider from "../../components/SectionDivider";
import { getAllPosts, getPostBySlug, formatDate } from "../../lib/blog";

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

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
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
            {post.date && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--fg-3)",
                  marginBottom: 12,
                }}
              >
                {formatDate(post.date)}
              </div>
            )}
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
          </article>
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
