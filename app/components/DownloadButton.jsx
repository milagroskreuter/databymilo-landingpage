"use client";
import { useState } from "react";

export default function DownloadButton({ href, title, slug }) {
  const [hovered, setHovered] = useState(false);

  if (!href) {
    return (
      <div
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 11,
          padding: "8px 16px",
          borderRadius: 999,
          background: "var(--cream-200)",
          color: "var(--fg-3)",
          border: "1.5px dashed rgba(139,26,74,.25)",
          letterSpacing: ".1em",
          textTransform: "uppercase",
        }}
      >
        Próximamente
      </div>
    );
  }

  return (
    <a
      href={href}
      download
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 14,
        padding: "12px 28px",
        borderRadius: 999,
        background: hovered ? "var(--vino)" : "transparent",
        color: hovered ? "#fff" : "var(--vino)",
        border: "1.5px solid var(--vino)",
        cursor: "pointer",
        transition: "all 200ms",
        letterSpacing: ".02em",
        textDecoration: "none",
      }}
    >
      Descargar →
    </a>
  );
}
