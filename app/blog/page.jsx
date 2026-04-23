import Link from "next/link";
import CTABlock from "../components/sections/CTABlock";
import Footer from "../components/sections/Footer";
import SectionDivider from "../components/SectionDivider";
import TypeEyebrow from "../components/primitives/TypeEyebrow";
import { getAllPosts, formatDate } from "../lib/blog";

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

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <>
      <main>
        <div className="journal">
          <section className="section">
            <div className="section-head">
              <TypeEyebrow className="eyebrow-j">El blog</TypeEyebrow>
              <div className="rule"></div>
              <div className="pagenum">pág. 50</div>
            </div>
            <h1 className="section-title">
              Historias <em>largas</em>.
            </h1>
            <p className="section-sub">
              Lo que no entra en un reel — casos reales, errores y data traducida al español.
            </p>

            {posts.length === 0 ? (
              <div
                style={{
                  marginTop: 64,
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
                  Todavía no hay posts publicados. Volvé pronto ✦
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 24,
                  marginTop: 64,
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
                      {post.date && (
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            fontSize: 10,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "var(--vino)",
                            opacity: 0.7,
                            marginBottom: 12,
                          }}
                        >
                          {formatDate(post.date)}
                        </div>
                      )}
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
