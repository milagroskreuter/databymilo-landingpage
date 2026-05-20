"use client";
import { track } from "@vercel/analytics";

export default function DownloadButton({ href, title, slug }) {
  return (
    <a
      href={href}
      download
      className="btn btn-primary"
      style={{ fontSize: 15, padding: "14px 32px", display: "inline-block" }}
      onClick={() => track("resource_download", { title, slug })}
    >
      Descargar gratis →
    </a>
  );
}
