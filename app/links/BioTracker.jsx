"use client";
import { useEffect } from "react";
import { hostToNetwork, refererHost } from "@/lib/marketing/links/shared";

// Pasa la red de origen a cada botón (/go/<slug>?via=bio&from=<red>), para que el
// click quede atribuido. La red sale de ?from= en el link de la bio
// (ej. databymilo.me/links?from=instagram) o, si no está, del referer.
export default function BioTracker() {
  useEffect(() => {
    let from = "";
    let preview = false;
    try {
      const params = new URLSearchParams(window.location.search);
      preview = params.has("preview");
      const q = params.get("from") || "";
      from = /^[a-z0-9-]{2,20}$/.test(q.toLowerCase()) ? q.toLowerCase() : "";
      if (!from) from = hostToNetwork(refererHost(document.referrer)) || "";
    } catch {}
    if (!from && !preview) return;
    document.querySelectorAll("a[data-mk-bio]").forEach((a) => {
      const url = new URL(a.getAttribute("href"), window.location.origin);
      if (from) url.searchParams.set("from", from);
      // Vista previa del admin: el click no se cuenta.
      if (preview) url.searchParams.set("preview", "1");
      a.setAttribute("href", url.pathname + url.search);
    });
  }, []);
  return null;
}
