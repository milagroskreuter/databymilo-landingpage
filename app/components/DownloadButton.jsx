"use client";
import { track } from "@vercel/analytics";

export default function DownloadButton({ href, title, slug }) {
  function handleClick() {
    track("resource_download", { title, slug });
    if (slug) {
      // keepalive: que el aviso llegue aunque el navegador cambie de página con la descarga.
      fetch(`/api/recursos/download/${encodeURIComponent(slug)}`, { method: "POST", keepalive: true }).catch(() => {});
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
