import Link from "next/link";

export default function NewsletterBar() {
  return (
    <div className="newsletter-bar" role="complementary" aria-label="Invitación al newsletter">
      <div className="newsletter-bar-inner">
        <span className="newsletter-bar-pill">la carta</span>
        <span className="newsletter-bar-text">
          <span className="bar-desktop">Una carta los domingos — <strong>corta, útil, humana</strong>.</span>
          <span className="bar-mobile">La carta del domingo.</span>
          {" "}
          <Link href="/#newsletter" className="newsletter-bar-cta">
            Sumame →
          </Link>
        </span>
      </div>
    </div>
  );
}
