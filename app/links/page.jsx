import { getBioPage, DEFAULT_PAGE } from "@/lib/marketing/links/data";
import { LinkIcon } from "@/lib/marketing/links/icons";
import BioTracker from "./BioTracker";
import "./links.css";

// Página de links de la bio (reemplaza Linktree). Se administra en
// /administracion-general/marketing/links y se refresca sola al guardar.
export const revalidate = 300;

export const metadata = {
  title: "Links",
  description: "Guías, recursos gratis y la carta del domingo de Data by Milo, todo en un lugar.",
  alternates: { canonical: "https://databymilo.me/links" },
  // Página para la bio de las redes: no compite en buscadores con la home.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Links | Data by Milo",
    description: "Guías, recursos gratis y la carta del domingo, todo en un lugar.",
    url: "https://databymilo.me/links",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Data by Milo" }],
  },
};

const SOCIAL_LABELS = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  threads: "Threads",
  youtube: "YouTube",
  tiktok: "TikTok",
};

// La barra superior, la franja del newsletter y el popup del sitio no tienen
// sentido en una página de links: se ocultan solo acá.
const HIDE_SITE_CHROME = `
body:has(.mk-links-page){padding-top:0!important}
body:has(.mk-links-page) .topbar,
body:has(.mk-links-page) .newsletter-bar,
body:has(.mk-links-page) div:has(> [aria-labelledby="newsletter-popup-title"]){display:none!important}
`;

async function loadPage() {
  try {
    return await getBioPage();
  } catch (err) {
    console.error("links page error:", err.message);
    return { page: DEFAULT_PAGE, links: [] };
  }
}

export default async function LinksPage() {
  const { page, links } = await loadPage();
  const socials = Object.entries(page.socials || {}).filter(([k, v]) => SOCIAL_LABELS[k] && v);

  return (
    <main className="mk-links-page">
      <style dangerouslySetInnerHTML={{ __html: HIDE_SITE_CHROME }} />
      <div className="mk-links-col">
        <header className="mk-links-head">
          {page.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="mk-links-photo"
              src={page.photo_url}
              alt={page.name || "Milo"}
              width={112}
              height={112}
              fetchPriority="high"
            />
          ) : null}
          <h1 className="mk-links-name">{page.name}</h1>
          {page.handle ? <p className="mk-links-handle">{page.handle}</p> : null}
          {page.bio ? <p className="mk-links-bio">{page.bio}</p> : null}
        </header>

        <nav className="mk-links-list" aria-label="Links">
          {links.length === 0 ? (
            <a className="mk-links-btn" href="/">
              <span className="mk-links-btn-text">Ir a databymilo.me</span>
              <span className="mk-links-btn-arrow" aria-hidden="true">→</span>
            </a>
          ) : (
            links.map((l) => (
              <a
                key={l.id}
                href={`/go/${l.slug}?via=bio`}
                data-mk-bio=""
                className={`mk-links-btn${l.featured ? " is-featured" : ""}`}
              >
                {l.icon ? (
                  <span className="mk-links-btn-icon">
                    <LinkIcon id={l.icon} />
                  </span>
                ) : null}
                <span className="mk-links-btn-text">{l.title}</span>
                <span className="mk-links-btn-arrow" aria-hidden="true">
                  {l.featured ? "✦" : "→"}
                </span>
              </a>
            ))
          )}
        </nav>

        {socials.length > 0 && (
          <div className="mk-links-socials">
            {socials.map(([k, href]) => (
              <a
                key={k}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LABELS[k]}
                className="mk-links-social"
              >
                <LinkIcon id={k} size={18} />
              </a>
            ))}
          </div>
        )}

        <footer className="mk-links-foot">
          {page.footer ? <p>{page.footer}</p> : null}
          <a href="/">databymilo.me</a>
        </footer>
      </div>
      <BioTracker />
    </main>
  );
}
