// Unsplash API oficial (https://unsplash.com/documentation).
// Reglas que respetamos:
//  - Mostrar las fotos desde las URLs de Unsplash (hotlink) en la búsqueda.
//  - Atribuir siempre: "Foto de <autor> en Unsplash" con links con utm_source y utm_medium=referral.
//  - Al guardar (descargar) una foto, disparar su links.download_location.

const API = "https://api.unsplash.com";

export function unsplashConfigured() {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY);
}

// Nombre de la app tal como figura en Unsplash Developers (para los utm).
const APP = process.env.UNSPLASH_APP_NAME || "data_by_milo_hub";

export function utm(url) {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set("utm_source", APP);
  u.searchParams.set("utm_medium", "referral");
  return u.toString();
}

async function unsplash(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Accept-Version": "v1", Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, ...(init.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Unsplash respondió ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
  }
  return res.json();
}

export function shapePhoto(p) {
  return {
    id: p.id,
    alt: p.alt_description || p.description || "",
    width: p.width,
    height: p.height,
    color: p.color,
    thumb: p.urls?.small,
    regular: p.urls?.regular,
    author: p.user?.name || p.user?.username,
    authorUrl: utm(p.user?.links?.html),
    photoUrl: utm(p.links?.html),
    unsplashUrl: utm("https://unsplash.com/"),
  };
}

export async function searchPhotos({ query, page = 1, orientation }) {
  const sp = new URLSearchParams({ query, page: String(page), per_page: "24", content_filter: "high" });
  if (orientation) sp.set("orientation", orientation);
  const data = await unsplash(`/search/photos?${sp}`);
  return { total: data.total, totalPages: data.total_pages, results: (data.results || []).map(shapePhoto) };
}

export async function getPhoto(id) {
  return unsplash(`/photos/${encodeURIComponent(id)}`);
}

/** Dispara el registro de descarga que pide Unsplash. */
export async function trackDownload(photo) {
  const loc = photo?.links?.download_location;
  if (!loc || !loc.startsWith(API)) return;
  await fetch(loc, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }, cache: "no-store" });
}
