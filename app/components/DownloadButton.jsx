"use client";
import { track } from "@vercel/analytics";

export default function DownloadButton({ href, title, slug }) {
  function handleClick() {
    track("resource_download", { title, slug });
    if (slug) {
      fetch(`/api/recursos/download/${slug}`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <a
      href={href}
      download
      className="btn btn-primary"
      style={{ fontSize: 15, padding: "14px 32px", display: "inline-block" }}
      onClick={handleClick}
    >
      Descargar gratis →
    </a>
  );
}
