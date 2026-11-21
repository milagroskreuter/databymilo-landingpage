// Herramientas que Claude puede usar desde el chat de Marketing.
// Leen y escriben las tablas compartidas (mk_content, mk_pillars, mk_series, mk_brand)
// y leen el blog y los recursos del sitio.
//
// Nota: cuando exista lib/marketing/content/ (área Calendario), las lecturas y
// escrituras de mk_content de este archivo se pueden mover a esas funciones.

import { NETWORKS, STATUSES, FORMATS } from "@/lib/marketing/constants";
import { validateInput } from "./validate";

export const TIMEZONE = "America/Argentina/Buenos_Aires";
const TZ_OFFSET = "-03:00"; // Argentina no tiene horario de verano
const BULK_CONFIRM_MIN = 3; // cambios a 3 piezas o más piden confirmación

const NETWORK_IDS = NETWORKS.map((n) => n.id);
const STATUS_IDS = STATUSES.map((s) => s.id);
const FORMAT_IDS = FORMATS.map((f) => f.id);
const BRAND_KEYS = ["voice", "rules", "bios", "palette", "typography", "moodboard", "logo"];

export class ToolError extends Error {}

// ---------- helpers ----------

const DATE_RE = "^\\d{4}-\\d{2}-\\d{2}([T ]\\d{2}:\\d{2}(:\\d{2})?(\\.\\d+)?(Z|[+-]\\d{2}:?\\d{2})?)?$";

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// "2026-11-24" → 10:00 hora argentina; "2026-11-24T18:30" → hora argentina; con zona → tal cual.
function toTimestamp(value, { dateOnlyTime = "10:00" } = {}) {
  if (value == null) return null;
  let v = String(value).trim().replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v = `${v}T${dateOnlyTime}:00${TZ_OFFSET}`;
  else if (!/(Z|[+-]\d{2}:?\d{2})$/.test(v)) v = `${v.length === 16 ? v + ":00" : v}${TZ_OFFSET}`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new ToolError(`Fecha inválida: ${value}`);
  return d.toISOString();
}

export function formatLocal(ts) {
  if (!ts) return null;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

function clip(text, n) {
  if (!text) return text;
  return text.length > n ? text.slice(0, n) + "…" : text;
}

function escapeLike(s) {
  return String(s).replace(/[%_,()\\]/g, " ").trim();
}

async function loadPillars(sb) {
  const { data, error } = await sb.from("mk_pillars").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data || [];
}

async function loadSeries(sb) {
  const { data, error } = await sb.from("mk_series").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data || [];
}

function resolveByName(list, ref, kind) {
  if (ref == null || ref === "") return null;
  const found = list.find((x) => x.id === ref) || list.find((x) => norm(x.name) === norm(ref));
  if (!found) {
    const options = list.map((x) => x.name).join(", ") || "ninguno";
    throw new ToolError(`No existe ${kind} "${ref}". Opciones: ${options}.`);
  }
  return found.id;
}

function compactContent(row, pillarsById, seriesById) {
  return {
    id: row.id,
    titulo: row.title,
    estado: row.status,
    red: row.network,
    formato: row.format,
    pilar: pillarsById[row.pillar_id]?.name || null,
    serie: seriesById[row.series_id]?.name || null,
    fecha: formatLocal(row.scheduled_at),
    fecha_iso: row.scheduled_at,
    publicada: formatLocal(row.published_at),
    gancho: clip(row.hook, 160),
    origen: row.source,
    potencial: row.score,
  };
}

function fullContent(row, pillarsById, seriesById) {
  return {
    ...compactContent(row, pillarsById, seriesById),
    gancho: row.hook,
    guion: row.script,
    caption: row.caption,
    cta: row.cta,
    notas: row.notes,
    tags: row.tags,
    blog_slug: row.blog_slug,
    permalink: row.permalink,
  };
}

const maps = (pillars, series) => [
  Object.fromEntries(pillars.map((p) => [p.id, p])),
  Object.fromEntries(series.map((s) => [s.id, s])),
];

// Pasa los campos de pieza del formato de la herramienta al de la tabla.
async function contentFieldsToRow(sb, fields, ctx = {}) {
  const row = {};
  const simple = ["title", "status", "network", "format", "hook", "script", "caption", "cta", "notes", "tags", "score", "permalink", "blog_slug"];
  for (const k of simple) if (fields[k] !== undefined) row[k] = fields[k];
  if (fields.pillar !== undefined) {
    ctx.pillars = ctx.pillars || (await loadPillars(sb));
    row.pillar_id = fields.pillar === null ? null : resolveByName(ctx.pillars, fields.pillar, "el pilar");
  }
  if (fields.series !== undefined) {
    ctx.series = ctx.series || (await loadSeries(sb));
    row.series_id = fields.series === null ? null : resolveByName(ctx.series, fields.series, "la serie");
  }
  if (fields.scheduled_at !== undefined) row.scheduled_at = fields.scheduled_at === null ? null : toTimestamp(fields.scheduled_at);
  if (row.status === "publicado" && fields.published_at === undefined) row.published_at = new Date().toISOString();
  return row;
}

async function titlesFor(sb, ids) {
  const { data } = await sb.from("mk_content").select("id, title, scheduled_at").in("id", ids);
  const byId = Object.fromEntries((data || []).map((r) => [r.id, r]));
  return ids.map((id) => (byId[id] ? `${byId[id].title}${byId[id].scheduled_at ? ` (${formatLocal(byId[id].scheduled_at)})` : ""}` : `${id} (no existe)`));
}

// ---------- esquemas reutilizables ----------

const str = (description, maxLength = 500) => ({ type: "string", description, maxLength });
const idSchema = { type: "string", description: "id (uuid) de la pieza", pattern: "^[0-9a-fA-F-]{36}$" };
const dateSchema = (description) => ({ type: ["string", "null"], description, pattern: DATE_RE });

const pieceProps = {
  title: { type: "string", description: "Título corto de la pieza o idea", minLength: 1, maxLength: 200 },
  status: { type: "string", enum: STATUS_IDS, description: "Estado. Una idea sin fecha es 'idea'." },
  network: { type: ["string", "null"], enum: [...NETWORK_IDS, null], description: "Red donde se publica" },
  format: { type: ["string", "null"], enum: [...FORMAT_IDS, null], description: "Formato" },
  pillar: { type: ["string", "null"], description: "Nombre (o id) del pilar, ej. 'Educativo'" },
  series: { type: ["string", "null"], description: "Nombre (o id) de la serie, si pertenece a una" },
  scheduled_at: dateSchema("Fecha de publicación. 'YYYY-MM-DD' (queda a las 10:00) o 'YYYY-MM-DDTHH:MM', hora argentina. null para sacarle la fecha."),
  hook: str("Gancho: la primera línea o los primeros 3 segundos", 1000),
  script: str("Guion o desarrollo completo (slides de carrusel, hilo, guion de reel, cuerpo del email)", 20000),
  caption: str("Caption / texto de la publicación", 5000),
  cta: str("Llamado a la acción", 500),
  notes: str("Notas internas", 3000),
  tags: { type: "array", items: { type: "string", maxLength: 60 }, maxItems: 20, description: "Etiquetas" },
  score: { type: ["integer", "null"], minimum: 1, maximum: 5, description: "Potencial de la idea, de 1 a 5" },
};

// ---------- definición de herramientas ----------

const TOOLS = [
  {
    name: "list_content",
    description:
      "Lista piezas de contenido del calendario y del banco de ideas (tabla mk_content). Usala antes de responder cualquier pregunta sobre qué hay planificado, qué toca esta semana, qué ideas hay o antes de editar piezas (para conseguir sus ids). Por defecto excluye las descartadas. Las fechas se filtran por fecha de publicación (hora argentina).",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        from: dateSchema("Desde (inclusive). 'YYYY-MM-DD' o fecha-hora."),
        to: dateSchema("Hasta (inclusive). 'YYYY-MM-DD' o fecha-hora."),
        status: { type: "array", items: { type: "string", enum: STATUS_IDS }, description: "Filtrar por estados" },
        network: { type: "string", enum: NETWORK_IDS },
        format: { type: "string", enum: FORMAT_IDS },
        pillar: { type: "string", description: "Nombre o id del pilar" },
        only_unscheduled: { type: "boolean", description: "Solo piezas sin fecha (banco de ideas)" },
        search: { type: "string", maxLength: 100, description: "Texto a buscar en el título" },
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Máximo de piezas (por defecto 50)" },
      },
    },
    async run(sb, input) {
      const [pillars, series] = await Promise.all([loadPillars(sb), loadSeries(sb)]);
      const [pById, sById] = maps(pillars, series);
      let q = sb.from("mk_content").select("*");
      if (input.status?.length) q = q.in("status", input.status);
      else q = q.neq("status", "descartado");
      if (input.network) q = q.eq("network", input.network);
      if (input.format) q = q.eq("format", input.format);
      if (input.pillar) q = q.eq("pillar_id", resolveByName(pillars, input.pillar, "el pilar"));
      if (input.only_unscheduled) q = q.is("scheduled_at", null);
      if (input.from) q = q.gte("scheduled_at", toTimestamp(input.from, { dateOnlyTime: "00:00" }));
      if (input.to) {
        const end = /^\d{4}-\d{2}-\d{2}$/.test(input.to) ? toTimestamp(input.to, { dateOnlyTime: "23:59" }) : toTimestamp(input.to);
        q = q.lte("scheduled_at", end);
      }
      if (input.search) q = q.ilike("title", `%${escapeLike(input.search)}%`);
      const limit = input.limit || 50;
      q = q.order("scheduled_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).limit(limit + 1);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const rows = data || [];
      return {
        piezas: rows.slice(0, limit).map((r) => compactContent(r, pById, sById)),
        hay_mas: rows.length > limit,
      };
    },
  },
  {
    name: "get_content",
    description: "Trae una pieza completa (gancho, guion, caption, CTA, notas). Usala cuando necesites el texto completo de una pieza.",
    input_schema: { type: "object", additionalProperties: false, required: ["id"], properties: { id: idSchema } },
    async run(sb, { id }) {
      const [{ data, error }, pillars, series] = await Promise.all([
        sb.from("mk_content").select("*").eq("id", id).maybeSingle(),
        loadPillars(sb),
        loadSeries(sb),
      ]);
      if (error) throw new Error(error.message);
      if (!data) throw new ToolError("No existe una pieza con ese id.");
      return fullContent(data, ...maps(pillars, series));
    },
  },
  {
    name: "create_content",
    description:
      "Crea UNA pieza o idea en el calendario. Usala cuando la usuaria pida agendar o anotar una pieza concreta. Para guardar varios borradores o ideas de una vez usá save_drafts.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["title"],
      properties: {
        ...pieceProps,
        source: { type: "string", enum: ["chat", "repurpose"], description: "'repurpose' si sale de un post del blog" },
        blog_slug: { type: "string", maxLength: 200, description: "Slug del post del blog de origen, si aplica" },
      },
    },
    async run(sb, input) {
      const row = await contentFieldsToRow(sb, input);
      row.source = input.source || "chat";
      if (!row.status) row.status = row.scheduled_at ? "guion" : "idea";
      const { data, error } = await sb.from("mk_content").insert(row).select("id, title, status, scheduled_at").single();
      if (error) throw new Error(error.message);
      return { creada: { id: data.id, titulo: data.title, estado: data.status, fecha: formatLocal(data.scheduled_at) } };
    },
  },
  {
    name: "update_content",
    description:
      "Edita una o varias piezas: mover fecha, cambiar estado, red, formato, pilar o textos. Aplica los mismos cambios a todas las ids indicadas. Si son 3 piezas o más, la interfaz le pide confirmación a la usuaria antes de aplicarlo.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["ids", "changes"],
      properties: {
        ids: { type: "array", items: idSchema, minItems: 1, maxItems: 50 },
        changes: {
          type: "object",
          additionalProperties: false,
          properties: { ...pieceProps, permalink: str("Link a la publicación real", 500) },
          description: "Solo los campos que cambian",
        },
      },
    },
    confirm: (input) => input.ids.length >= BULK_CONFIRM_MIN,
    async describe(sb, input) {
      const fields = Object.entries(input.changes)
        .map(([k, v]) => `${k} → ${v === null ? "vacío" : clip(Array.isArray(v) ? v.join(", ") : String(v), 60)}`)
        .join("; ");
      return { summary: `Cambiar ${input.ids.length} piezas: ${fields}`, items: await titlesFor(sb, input.ids) };
    },
    async run(sb, input) {
      if (!Object.keys(input.changes).length) throw new ToolError("No indicaste ningún cambio.");
      const row = await contentFieldsToRow(sb, input.changes);
      row.updated_at = new Date().toISOString();
      const { data, error } = await sb.from("mk_content").update(row).in("id", input.ids).select("id, title");
      if (error) throw new Error(error.message);
      const missing = input.ids.filter((id) => !(data || []).some((r) => r.id === id));
      return { actualizadas: (data || []).map((r) => r.title), ids_inexistentes: missing };
    },
  },
  {
    name: "discard_content",
    description:
      "Descarta piezas (pasan a estado 'descartado'; no se borran de la base). Siempre pide confirmación a la usuaria en la interfaz.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["ids"],
      properties: {
        ids: { type: "array", items: idSchema, minItems: 1, maxItems: 50 },
        reason: str("Motivo (se agrega a las notas)", 300),
      },
    },
    confirm: () => true,
    async describe(sb, input) {
      return {
        summary: `Descartar ${input.ids.length === 1 ? "1 pieza" : `${input.ids.length} piezas`}${input.reason ? ` (${input.reason})` : ""}`,
        items: await titlesFor(sb, input.ids),
      };
    },
    async run(sb, input) {
      const { data: rows, error: e1 } = await sb.from("mk_content").select("id, title, notes").in("id", input.ids);
      if (e1) throw new Error(e1.message);
      const now = new Date().toISOString();
      for (const r of rows || []) {
        const notes = input.reason ? [r.notes, `Descartada: ${input.reason}`].filter(Boolean).join("\n") : r.notes;
        const { error } = await sb.from("mk_content").update({ status: "descartado", notes, updated_at: now }).eq("id", r.id);
        if (error) throw new Error(error.message);
      }
      return { descartadas: (rows || []).map((r) => r.title) };
    },
  },
  {
    name: "save_drafts",
    description:
      "Guarda varios borradores o ideas de una vez en mk_content (por ejemplo, las piezas que salieron de reutilizar un post del blog, o una tanda de ideas para un pilar). La interfaz le muestra la lista a la usuaria y solo se guardan si ella acepta, así que llamala directamente cuando ofrezcas guardar.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["pieces", "source"],
      properties: {
        source: { type: "string", enum: ["repurpose", "chat"], description: "'repurpose' si salen de un post del blog; si no, 'chat'" },
        blog_slug: { type: "string", maxLength: 200, description: "Slug del post de origen (para repurpose)" },
        pieces: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: { type: "object", additionalProperties: false, required: ["title"], properties: pieceProps },
        },
      },
    },
    confirm: () => true,
    async describe(_sb, input) {
      return {
        summary: `Guardar ${input.pieces.length === 1 ? "1 pieza" : `${input.pieces.length} piezas`}${input.source === "repurpose" ? " reutilizadas del blog" : ""}`,
        items: input.pieces.map((p) => [p.title, p.network, p.format, p.pillar, p.scheduled_at].filter(Boolean).join(" · ")),
      };
    },
    async run(sb, input) {
      const ctx = {};
      const rows = [];
      for (const p of input.pieces) {
        const row = await contentFieldsToRow(sb, p, ctx);
        row.source = input.source;
        if (input.blog_slug) row.blog_slug = input.blog_slug;
        if (!row.status) row.status = row.script ? "guion" : "idea";
        rows.push(row);
      }
      const { data, error } = await sb.from("mk_content").insert(rows).select("id, title, status");
      if (error) throw new Error(error.message);
      return { guardadas: (data || []).map((r) => ({ id: r.id, titulo: r.title, estado: r.status })) };
    },
  },
  {
    name: "list_pillars",
    description: "Lista los pilares de contenido con su % objetivo. Usala antes de crear piezas con pilar o de hablar de pilares.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { include_inactive: { type: "boolean", description: "Incluir pilares desactivados" } },
    },
    async run(sb, input) {
      const pillars = await loadPillars(sb);
      return {
        pilares: pillars
          .filter((p) => input.include_inactive || p.active)
          .map((p) => ({ id: p.id, nombre: p.name, descripcion: p.description, objetivo_pct: p.target_pct, color: p.color, activo: p.active })),
      };
    },
  },
  {
    name: "create_pillar",
    description: "Crea un pilar de contenido nuevo.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1, maxLength: 60 },
        description: str("Descripción", 300),
        color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$", description: "Color hex, ej. #8b1a4a" },
        target_pct: { type: "integer", minimum: 0, maximum: 100, description: "% objetivo del total de piezas" },
      },
    },
    async run(sb, input) {
      const pillars = await loadPillars(sb);
      if (pillars.some((p) => norm(p.name) === norm(input.name))) throw new ToolError(`Ya existe un pilar "${input.name}".`);
      const sort = Math.max(0, ...pillars.map((p) => p.sort_order || 0)) + 1;
      const { data, error } = await sb
        .from("mk_pillars")
        .insert({ name: input.name, description: input.description || null, color: input.color || "#8b1a4a", target_pct: input.target_pct ?? null, sort_order: sort })
        .select("id, name")
        .single();
      if (error) throw new Error(error.message);
      const total = pillars.filter((p) => p.active).reduce((a, p) => a + (p.target_pct || 0), 0) + (input.target_pct || 0);
      return { creado: data, suma_objetivos_pct: total };
    },
  },
  {
    name: "update_pillar",
    description: "Edita un pilar: nombre, descripción, color, % objetivo, orden o activarlo/desactivarlo.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["pillar", "changes"],
      properties: {
        pillar: { type: "string", description: "Nombre o id del pilar" },
        changes: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 60 },
            description: { type: ["string", "null"], maxLength: 300 },
            color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
            target_pct: { type: ["integer", "null"], minimum: 0, maximum: 100 },
            sort_order: { type: "integer", minimum: 0, maximum: 100 },
            active: { type: "boolean" },
          },
        },
      },
    },
    async run(sb, input) {
      const pillars = await loadPillars(sb);
      const id = resolveByName(pillars, input.pillar, "el pilar");
      const { data, error } = await sb.from("mk_pillars").update(input.changes).eq("id", id).select("id, name, target_pct, active").single();
      if (error) throw new Error(error.message);
      const updated = pillars.map((p) => (p.id === id ? { ...p, ...data } : p));
      return { actualizado: data, suma_objetivos_pct: updated.filter((p) => p.active).reduce((a, p) => a + (p.target_pct || 0), 0) };
    },
  },
  {
    name: "pillar_balance",
    description:
      "Calcula el balance de pilares: % real de piezas por pilar contra el % objetivo, en un rango de fechas (por defecto, de 30 días atrás a 30 días adelante). Cuenta piezas con fecha de publicación o publicadas, sin ideas ni descartadas.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { from: dateSchema("Desde, 'YYYY-MM-DD'"), to: dateSchema("Hasta, 'YYYY-MM-DD'") },
    },
    async run(sb, input) {
      const day = 86400000;
      const from = input.from ? toTimestamp(input.from, { dateOnlyTime: "00:00" }) : new Date(Date.now() - 30 * day).toISOString();
      const to = input.to ? toTimestamp(input.to, { dateOnlyTime: "23:59" }) : new Date(Date.now() + 30 * day).toISOString();
      const [pillars, { data, error }] = await Promise.all([
        loadPillars(sb),
        sb.from("mk_content").select("pillar_id, scheduled_at, published_at, status").not("status", "in", "(descartado,idea)"),
      ]);
      if (error) throw new Error(error.message);
      const rows = (data || []).filter((r) => {
        const when = r.published_at || r.scheduled_at;
        return when && when >= from && when <= to;
      });
      const total = rows.length;
      const counts = {};
      for (const r of rows) counts[r.pillar_id || "none"] = (counts[r.pillar_id || "none"] || 0) + 1;
      const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);
      return {
        rango: { desde: formatLocal(from), hasta: formatLocal(to) },
        total_piezas: total,
        pilares: pillars
          .filter((p) => p.active || counts[p.id])
          .map((p) => ({
            pilar: p.name,
            piezas: counts[p.id] || 0,
            real_pct: pct(counts[p.id] || 0),
            objetivo_pct: p.target_pct,
            diferencia_pts: p.target_pct == null ? null : Math.round((pct(counts[p.id] || 0) - p.target_pct) * 10) / 10,
          })),
        sin_pilar: counts.none || 0,
      };
    },
  },
  {
    name: "list_series",
    description: "Lista las series o formatos recurrentes (ej. 'Dato del lunes') con su pilar, red y cadencia.",
    input_schema: { type: "object", additionalProperties: false, properties: { include_inactive: { type: "boolean" } } },
    async run(sb, input) {
      const [pillars, series] = await Promise.all([loadPillars(sb), loadSeries(sb)]);
      const [pById] = maps(pillars, series);
      return {
        series: series
          .filter((s) => input.include_inactive || s.active)
          .map((s) => ({ id: s.id, nombre: s.name, descripcion: s.description, pilar: pById[s.pillar_id]?.name || null, red: s.network, formato: s.format, cadencia: s.cadence, activa: s.active })),
      };
    },
  },
  ...(() => {
    const cadence = {
      type: "object",
      additionalProperties: false,
      description: "Cadencia, ej. {freq:'weekly', weekday:1, time:'10:00'} (weekday: 0=domingo)",
      properties: {
        freq: { type: "string", enum: ["daily", "weekly", "biweekly", "monthly"] },
        weekday: { type: "integer", minimum: 0, maximum: 6 },
        time: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
      },
    };
    const seriesProps = {
      name: { type: "string", minLength: 1, maxLength: 80 },
      description: { type: ["string", "null"], maxLength: 300 },
      pillar: { type: ["string", "null"], description: "Nombre o id del pilar" },
      network: { type: ["string", "null"], enum: [...NETWORK_IDS, null] },
      format: { type: ["string", "null"], enum: [...FORMAT_IDS, null] },
      cadence,
    };
    async function toRow(sb, f) {
      const row = {};
      for (const k of ["name", "description", "network", "format", "cadence", "active"]) if (f[k] !== undefined) row[k] = f[k];
      if (f.pillar !== undefined) row.pillar_id = f.pillar === null ? null : resolveByName(await loadPillars(sb), f.pillar, "el pilar");
      return row;
    }
    return [
      {
        name: "create_series",
        description: "Crea una serie o formato recurrente.",
        input_schema: { type: "object", additionalProperties: false, required: ["name"], properties: seriesProps },
        async run(sb, input) {
          const { data, error } = await sb.from("mk_series").insert(await toRow(sb, input)).select("id, name").single();
          if (error) throw new Error(error.message);
          return { creada: data };
        },
      },
      {
        name: "update_series",
        description: "Edita una serie: nombre, descripción, pilar, red, formato, cadencia o activarla/desactivarla.",
        input_schema: {
          type: "object",
          additionalProperties: false,
          required: ["series", "changes"],
          properties: {
            series: { type: "string", description: "Nombre o id de la serie" },
            changes: { type: "object", additionalProperties: false, properties: { ...seriesProps, active: { type: "boolean" } } },
          },
        },
        async run(sb, input) {
          const id = resolveByName(await loadSeries(sb), input.series, "la serie");
          const { data, error } = await sb.from("mk_series").update(await toRow(sb, input.changes)).eq("id", id).select("id, name, active").single();
          if (error) throw new Error(error.message);
          return { actualizada: data };
        },
      },
    ];
  })(),
  {
    name: "list_blog_posts",
    description: "Lista los posts del blog del sitio (más nuevos primero). Usala para encontrar el último post o un post por tema antes de reutilizarlo.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string", maxLength: 100, description: "Texto a buscar en el título" },
        include_drafts: { type: "boolean", description: "Incluir borradores no publicados" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
    },
    async run(sb, input) {
      let q = sb.from("blog_posts").select("slug, title, date, excerpt, tags, published, word_count");
      if (!input.include_drafts) q = q.eq("published", true);
      if (input.search) q = q.ilike("title", `%${escapeLike(input.search)}%`);
      const { data, error } = await q.order("date", { ascending: false }).limit(input.limit || 15);
      if (error) throw new Error(error.message);
      return {
        posts: (data || []).map((p) => ({ slug: p.slug, titulo: p.title, fecha: p.date, resumen: p.excerpt, tags: p.tags, publicado: p.published, palabras: p.word_count, url: `https://databymilo.me/blog/${p.slug}` })),
      };
    },
  },
  {
    name: "get_blog_post",
    description: "Trae el contenido completo (markdown) de un post del blog. Usala antes de reutilizar un post en redes.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["slug"],
      properties: { slug: { type: "string", minLength: 1, maxLength: 200 } },
    },
    async run(sb, { slug }) {
      const { data, error } = await sb.from("blog_posts").select("slug, title, date, excerpt, tags, content, published").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new ToolError(`No existe un post con slug "${slug}". Usá list_blog_posts para buscarlo.`);
      const LIMIT = 60000;
      const content = data.content || "";
      return {
        slug: data.slug,
        titulo: data.title,
        fecha: data.date,
        resumen: data.excerpt,
        tags: data.tags,
        publicado: data.published,
        url: `https://databymilo.me/blog/${data.slug}`,
        contenido: content.slice(0, LIMIT),
        ...(content.length > LIMIT ? { aviso: `El post es largo: se muestran los primeros ${LIMIT} de ${content.length} caracteres.` } : {}),
      };
    },
  },
  {
    name: "list_resources",
    description: "Lista los recursos del sitio (ebooks pagos en Hotmart y recursos gratis). Usala para CTAs de venta o para el pilar Venta.",
    input_schema: { type: "object", additionalProperties: false, properties: {} },
    async run(sb) {
      const { data, error } = await sb
        .from("resources")
        .select("slug, title, type, is_paid, price, price_note, description, for_who, bullets, href, payment_url, badge")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return {
        recursos: (data || []).map((r) => ({ slug: r.slug, titulo: r.title, tipo: r.type, pago: r.is_paid, precio: r.price, nota_precio: r.price_note, descripcion: r.description, para_quien: r.for_who, puntos: r.bullets, link: r.payment_url || r.href, etiqueta: r.badge })),
      };
    },
  },
  {
    name: "get_brand",
    description:
      "Lee el sistema de marca (tabla mk_brand): voz, reglas y bios por defecto; también paleta, tipografías, moodboard o logo si se piden. Usala antes de escribir textos para publicar (ganchos, captions, guiones), una vez por conversación.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { keys: { type: "array", items: { type: "string", enum: BRAND_KEYS }, description: "Claves a leer (por defecto voice, rules, bios)" } },
    },
    async run(sb, input) {
      const keys = input.keys?.length ? input.keys : ["voice", "rules", "bios"];
      const { data, error } = await sb.from("mk_brand").select("key, value").in("key", keys);
      if (error) throw new Error(error.message);
      const found = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
      const missing = keys.filter((k) => !(k in found));
      return {
        marca: found,
        ...(missing.length ? { sin_cargar: missing, aviso: "Esas claves todavía no están cargadas en Marca y diseño; usá la voz por defecto del system prompt." } : {}),
      };
    },
  },
];

const TOOL_BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

// Definiciones para la API de Claude (el request es en streaming, por eso eager_input_streaming).
export const TOOL_DEFINITIONS = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.input_schema,
  eager_input_streaming: true,
}));

export function getTool(name) {
  return TOOL_BY_NAME[name] || null;
}

// Valida la entrada. Devuelve { tool, errors }.
export function checkToolCall(name, input) {
  const tool = getTool(name);
  if (!tool) return { tool: null, errors: [`Herramienta desconocida: ${name}`] };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { tool, errors: ["La entrada tiene que ser un objeto"] };
  return { tool, errors: validateInput(tool.input_schema, input) };
}

export function needsConfirmation(name, input) {
  const tool = getTool(name);
  return !!tool?.confirm?.(input);
}

export async function describeCall(sb, name, input) {
  const tool = getTool(name);
  if (tool?.describe) return tool.describe(sb, input);
  return { summary: name, items: [] };
}

// Ejecuta y arma el bloque tool_result.
export async function executeTool(sb, toolUseId, name, input) {
  const { tool, errors } = checkToolCall(name, input);
  if (errors.length) {
    return { type: "tool_result", tool_use_id: toolUseId, is_error: true, content: JSON.stringify({ INVALID_INPUT: errors, input }) };
  }
  try {
    const result = await tool.run(sb, input);
    return { type: "tool_result", tool_use_id: toolUseId, content: JSON.stringify(result) };
  } catch (err) {
    const message = err instanceof ToolError ? err.message : `Error al ejecutar: ${err.message}`;
    return { type: "tool_result", tool_use_id: toolUseId, is_error: true, content: message };
  }
}
