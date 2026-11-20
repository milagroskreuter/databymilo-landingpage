// Links y embudo: utilidades sin dependencias de servidor (las usa también el admin).

export const SITE_HOSTS = ["databymilo.me", "www.databymilo.me"];
export const SITE = "https://databymilo.me";

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 60;

export function slugify(text, max = SLUG_MAX) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max)
    .replace(/-$/g, "");
}

export function shortUrl(slug) {
  return `${SITE}/go/${slug}`;
}

export const DEST_TYPES = [
  { id: "url", label: "Una URL" },
  { id: "resource", label: "Recurso del sitio (página)" },
  { id: "resource_checkout", label: "Recurso pago (directo al pago)" },
  { id: "list", label: "Lista de mails" },
];

// Íconos disponibles para los botones de /links (el componente vive en icons.jsx).
export const ICONS = [
  { id: "", label: "Sin ícono" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
  { id: "threads", label: "Threads" },
  { id: "tiktok", label: "TikTok" },
  { id: "mail", label: "Mail / newsletter" },
  { id: "book", label: "Ebook / guía" },
  { id: "gift", label: "Regalo / gratis" },
  { id: "download", label: "Descarga" },
  { id: "pen", label: "Blog" },
  { id: "calendar", label: "Agenda / evento" },
  { id: "play", label: "Video" },
  { id: "star", label: "Estrella" },
  { id: "heart", label: "Corazón" },
  { id: "link", label: "Link" },
];

// Hostname del referer → red. Incluye los dominios de redirección de cada app.
const HOST_NETWORK = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)facebook\.com$|^fb\.me$|^m\.me$/, "facebook"],
  [/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/, "pinterest"],
  [/(^|\.)(x|twitter)\.com$|^t\.co$/, "x"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)resend\.(com|dev)$|mail\.google\.com$|outlook\./, "newsletter"],
];

export function hostToNetwork(host) {
  const h = String(host || "").toLowerCase().replace(/^www\./, "");
  if (!h) return null;
  for (const [re, net] of HOST_NETWORK) if (re.test(h)) return net;
  return null;
}

export function refererHost(referer) {
  if (!referer) return null;
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|skypeuripreview|vkshare|pinterest\/|bitlybot|headless|lighthouse|curl|wget|python-requests|axios|node-fetch|go-http/i;

/** Tipo de dispositivo a partir del User-Agent (sin guardar el UA). */
export function deviceFromUA(ua) {
  const s = String(ua || "");
  if (!s || BOT_RE.test(s)) return "bot";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|instagram|fban|fbav/i.test(s)) return "mobile";
  return "desktop";
}

export function isInternalUrl(url) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    return SITE_HOSTS.includes(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isHotmartUrl(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return /(^|\.)hotmart\.com$/.test(h) || h === "hotm.art";
  } catch {
    return false;
  }
}

/** sck que se manda a Hotmart para atribuir la venta: mk_<slug>_<red>. */
export function makeSck(slug, network) {
  return `mk_${slug}_${network || "directo"}`;
}

export function parseSck(sck) {
  const m = /^mk_([a-z0-9-]+)_([a-z0-9-]+)$/.exec(String(sck || ""));
  return m ? { slug: m[1], network: m[2] === "directo" ? null : m[2] } : null;
}

/**
 * URL final de un link. Si el destino es el propio sitio agrega UTM
 * (utm_source = red, utm_medium = social, utm_campaign = campaña); si es Hotmart
 * agrega sck/src para que la venta llegue atribuida en el webhook.
 */
export function buildDestination(link, { network, via } = {}) {
  let raw = null;
  switch (link.dest_type) {
    case "resource": {
      const r = link.resource;
      raw = r?.href && r.href.startsWith("/recursos/") ? r.href : `/recursos/${link.resource_slug}`;
      break;
    }
    case "resource_checkout":
      raw = link.resource?.payment_url || `/recursos/${link.resource_slug}`;
      break;
    case "list":
      raw = `/listas/${link.list_slug}`;
      break;
    default:
      raw = link.url;
  }
  if (!raw) return SITE;

  let url;
  try {
    url = new URL(raw, SITE);
  } catch {
    return SITE;
  }
  if (!/^https?:$/.test(url.protocol)) return SITE;

  const source = network || (via === "bio" ? "bio" : "directo");
  if (link.add_utm !== false && isInternalUrl(url.toString())) {
    const p = url.searchParams;
    if (!p.has("utm_source")) p.set("utm_source", source);
    if (!p.has("utm_medium")) p.set("utm_medium", "social");
    if (!p.has("utm_campaign")) p.set("utm_campaign", link.campaign || (via === "bio" ? "bio" : link.slug));
    if (!p.has("utm_content")) p.set("utm_content", link.slug);
  } else if (isHotmartUrl(url.toString())) {
    const p = url.searchParams;
    if (!p.has("sck")) p.set("sck", makeSck(link.slug, network));
    if (!p.has("src")) p.set("src", source);
  }
  return url.toString();
}

// Redes que pueden aparecer en clicks/referers además de las de lib/marketing/constants.js.
export const EXTRA_NETWORKS = {
  facebook: { label: "Facebook", color: "#1877f2" },
  pinterest: { label: "Pinterest", color: "#e60023" },
  x: { label: "X", color: "#444444" },
  google: { label: "Google", color: "#34a853" },
  bio: { label: "Bio (sin red)", color: "#d4447a" },
  directo: { label: "Directo", color: "#a59098" },
  "sin-red": { label: "Sin red", color: "#cbbcc2" },
};
