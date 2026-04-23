import Link from "next/link";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";
import TypeEyebrow from "../components/primitives/TypeEyebrow";
import { getAllPosts, getAllTags, formatDate } from "../lib/blog";

export const metadata = {
  title: "Blog",
  description:
    "Historias largas, explicaciones y data traducida al español. Casos reales, errores incluidos.",
  alternates: { canonical: "https://databymilo.me/blog" },
  openGraph: {
    title: "Blog | Data by Milo",
    description: "Historias largas, explicaciones y data traducida al español.",
    url: "https://databymilo.me/blog",
  },
};

function TagChip({ label, href, active, count }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: active ? "var(--cream)" : "var(--vino)",
        background: active ? "var(--vino)" : "transparent",
        border: `1.5px solid var(--vino)`,
        padding: "8px 16px",
        borderRadius: 999,
        textDecoration: "none",
        transition: "background 160ms, color 160ms",
      }}
    >
      {label}
      {typeof count === "number" && (
        <span style={{ opacity: 0.65, fontWeight: 500 }}>· {count}</span>
      )}
    </Link>
  );
}

export default function BlogIndexPage({ searchParams }) {
  const activeTag = searchParams?.tag || null;
  const allPosts = getAllPosts();
  const allTags = getAllTags();
  const posts = activeTag ? allPosts.filter((p) => p.tags.includes(activeTag)) : allPosts;

  return (
    <>
      <main>
        <div className="journal">
          <section className="section">
            <div className="section-head">
              <TypeEyebrow className="eyebrow-j">Capítulo 03</TypeEyebrow>
              <div className="rule"></div>
              <div className="pagenum">pág. 50</div>
            </div>
            <h1 className="section-title">
              Historias <em>largas</em>.
            </h1>
            <p className="section-sub">
              Lo que no entra en un reel: casos reales, errores y data traducida al español.
            </p>

            {allTags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 40,
                  alignItems: "center",
                }}
              >
                <TagChip
                  label="Todos"
                  href="/blog"
                  active={!activeTag}
                  count={allPosts.length}
                />
                {allTags.map(({ tag, count }) => (
                  <TagChip
                    key={tag}
                    label={`#${tag}`}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    active={activeTag === tag}
                    count={count}
                  />
                ))}
              </div>
            )}

            {posts.length === 0 ? (
              <div
                style={{
                  marginTop: 48,
                  padding: 48,
                  borderRadius: 16,
                  background: "var(--rosa-50)",
                  border: "1px dashed rgba(139,26,74,.2)",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 20,
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {activeTag
                    ? `No hay posts con #${activeTag} todavía. Probá con otro filtro.`
                    : "Todavía no hay posts publicados. Volvé pronto ✦"}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 24,
                  marginTop: 48,
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
                        borderRadius: 14,
                        padding: "32px 28px",
                        border: "1px solid rgba(139,26,74,.12)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 220ms, box-shadow 220ms",
                        boxShadow: "0 4px 12px rgba(139,26,74,.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 14,
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
                            opacity: 0.75,
                          }}
                        >
                          Entrada Nº {post.entradaStr}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                          {post.readingTime && (
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)" }}>
                              {post.readingTime}
                            </div>
                          )}
                          {post.date && (
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: 11,
                                color: "var(--fg-3)",
                              }}
                            >
                              {formatDate(post.date)}
                            </div>
                          )}
                        </div>
                      </div>
                      <h2
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontWeight: 700,
                          fontSize: 26,
                          color: "var(--ink)",
                          margin: "0 0 14px",
                          lineHeight: 1.2,
                        }}
                      >
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "var(--fg-2)",
                            margin: "0 0 18px",
                          }}
                        >
                          {post.excerpt}
                        </p>
                      )}
                      {post.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                          {post.tags.map((t) => (
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
                                padding: "4px 10px",
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
            )}
          </section>
          <SectionDivider />
          <CTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
