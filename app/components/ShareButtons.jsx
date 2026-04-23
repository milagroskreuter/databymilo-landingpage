"use client";
import { useState } from "react";

const BASE = "https://databymilo.me";

export default function ShareButtons({ slug, title }) {
  const [copied, setCopied] = useState(false);
  const url = `${BASE}/blog/${slug}`;

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=databymilo`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginTop: 48, marginBottom: 8 }}>
      <div
        className="eyebrow-j"
        style={{ color: "var(--vino)", marginBottom: 16 }}
      >
        Compartir
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          style={pillStyle}
        >
          Twitter / X
        </a>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          style={pillStyle}
        >
          LinkedIn
        </a>
        <button
          onClick={copyLink}
          style={{
            ...pillStyle,
            background: copied ? "var(--vino)" : "transparent",
            color: copied ? "var(--cream)" : "var(--vino)",
            border: "1.5px solid var(--vino)",
            cursor: "pointer",
            transition: "background 200ms, color 200ms",
          }}
        >
          {copied ? "¡Link copiado! ✦" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}

const pillStyle = {
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--vino)",
  background: "transparent",
  border: "1.5px solid var(--vino)",
  borderRadius: 999,
  padding: "9px 20px",
  textDecoration: "none",
  display: "inline-block",
};
