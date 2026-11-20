// Validación de lo que manda el admin al crear o editar un link.
import { SLUG_RE, SLUG_MAX, slugify, DEST_TYPES, ICONS } from "./shared";

const RESERVED = new Set(["admin", "api", "links", "go"]);
const DEST_IDS = new Set(DEST_TYPES.map((d) => d.id));
const ICON_IDS = new Set(ICONS.map((i) => i.id).filter(Boolean));
const UUID_RE = /^[0-9a-f-]{36}$/i;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const orNull = (v) => (v ? v : null);

/**
 * @param {object} body
 * @param {{partial?: boolean}} opts partial = PATCH (solo valida lo que viene)
 * @returns {{ row?: object, error?: string }}
 */
export function cleanLink(body, { partial = false } = {}) {
  const row = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has("title")) {
    const title = str(body.title, 120);
    if (!title) return { error: "Poné un título" };
    row.title = title;
  }

  if (!partial || has("slug")) {
    const slug = slugify(body.slug || body.title, SLUG_MAX);
    if (!slug || !SLUG_RE.test(slug)) return { error: "El link corto solo puede tener letras, números y guiones" };
    if (RESERVED.has(slug)) return { error: `"${slug}" está reservado, elegí otro` };
    row.slug = slug;
  }

  if (!partial || has("dest_type")) {
    const t = DEST_IDS.has(body.dest_type) ? body.dest_type : "url";
    row.dest_type = t;
    row.url = null;
    row.resource_slug = null;
    row.list_slug = null;
    if (t === "url") {
      const url = str(body.url, 2000);
      if (!url) return { error: "Poné la URL de destino" };
      if (!url.startsWith("/")) {
        try {
          const u = new URL(url);
          if (!/^https?:$/.test(u.protocol)) throw new Error();
        } catch {
          return { error: "La URL tiene que empezar con https:// (o con / si es del sitio)" };
        }
      }
      row.url = url;
    } else if (t === "resource" || t === "resource_checkout") {
      const r = str(body.resource_slug, 80);
      if (!r) return { error: "Elegí el recurso" };
      row.resource_slug = r;
    } else if (t === "list") {
      const l = str(body.list_slug, 40);
      if (!l) return { error: "Elegí la lista" };
      row.list_slug = l;
    }
  }

  if (!partial || has("campaign")) row.campaign = orNull(slugify(body.campaign, 60));
  if (!partial || has("network")) row.network = orNull(str(body.network, 20).toLowerCase().replace(/[^a-z0-9-]/g, ""));
  if (!partial || has("keyword")) row.keyword = orNull(str(body.keyword, 40).toUpperCase());
  if (!partial || has("notes")) row.notes = orNull(str(body.notes, 1000));
  if (!partial || has("content_id")) row.content_id = UUID_RE.test(body.content_id || "") ? body.content_id : null;
  if (!partial || has("icon")) row.icon = ICON_IDS.has(body.icon) ? body.icon : null;

  for (const k of ["add_utm", "active", "in_bio", "featured"]) {
    if (!partial || has(k)) {
      const def = k === "add_utm" || k === "active";
      row[k] = has(k) ? !!body[k] : def;
    }
  }

  return { row };
}
