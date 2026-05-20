"use client";
import { useState } from "react";

const BASE = "https://databymilo.me";

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

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
      <div className="eyebrow-j" style={{ color: "var(--vino)", marginBottom: 16 }}>
        Compartir
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href={twitterHref} target="_blank" rel="noopener noreferrer" style={pillStyle}>
          <IconX />
          Twitter / X
        </a>
        <a href={linkedinHref} target="_blank" rel="noopener noreferrer" style={pillStyle}>
          <IconLinkedIn />
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
          <IconLink />
          {copied ? "¡Copiado! ✦" : "Copiar link"}
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
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};
