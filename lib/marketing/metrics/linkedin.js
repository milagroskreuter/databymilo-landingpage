// Importador del archivo de estadísticas que LinkedIn deja exportar desde
// el perfil (Analytics → Impresiones de publicaciones / Seguidores → Exportar).
// El XLSX trae varias hojas (en inglés o en el idioma del perfil):
//   DISCOVERY / DESCUBRIMIENTO      → totales del período
//   ENGAGEMENT / INTERACCIÓN        → por día: fecha, impresiones, interacciones
//   TOP POSTS / PUBLICACIONES ...   → hasta 50 publicaciones: URL, fecha, interacciones | URL, fecha, impresiones
//   FOLLOWERS / SEGUIDORES          → "Total followers on <fecha>: N" + por día: fecha, nuevos seguidores
// El formato cambia de vez en cuando, así que se reconocen las hojas por nombre
// y por encabezados, sin depender de posiciones fijas.
import { toInt } from "./http";
import { postKey } from "./store";

const MAX_BYTES = 5 * 1024 * 1024;

const norm = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const RX = {
  date: /^(date|fecha|data|datum)$/,
  newFollowers: /(new followers|nuevos seguidores|novos seguidores|neue follower)/,
  totalFollowers: /(total followers|total de seguidores|seguidores totales|total de seguidores|followers totali|total follower)/,
  impressions: /(impression|impresion|impresso)/,
  engagements: /(engagement|interacci|interac|engajamento)/,
  url: /(url|link|enlace)/,
  publishDate: /(publish|publicaci|publicacao|fecha|date|data)/,
  reached: /(members reached|miembros alcanzados|membros alcancados|alcanzad|reached)/,
};

/** Convierte una celda de fecha a "YYYY-MM-DD". `dmy` decide el orden en "1/2/2026". */
function cellDate(v, dmy) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // número de serie de Excel (días desde 1899-12-30)
    return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    let [a, b] = [+m[1], +m[2]];
    let year = +m[3];
    if (year < 100) year += 2000;
    let month = dmy ? b : a;
    let day = dmy ? a : b;
    if (month > 12 && day <= 12) [month, day] = [day, month];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

/** Elige el orden de fecha mirando todos los valores de una columna. */
function guessDmy(values, fallback) {
  for (const v of values) {
    const m = typeof v === "string" && v.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (!m) continue;
    if (+m[1] > 12) return true;
    if (+m[2] > 12) return false;
  }
  return fallback;
}

function findHeaderRow(rows, tests, maxScan = 15) {
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const cells = (rows[i] || []).map(norm);
    if (tests.every((t) => cells.some((c) => t.test(c)))) return i;
  }
  return -1;
}

function looksSpanish(sheets) {
  const text = sheets.map((s) => s.sheet + " " + (s.data || []).slice(0, 5).flat().join(" ")).join(" ");
  return /(seguidores|fecha|impresiones|interacci|publicaci|data de|novos)/i.test(text);
}

// ─── Hojas ───────────────────────────────────────────────────────────────────

function parseFollowers(rows, dmyFallback) {
  let total = null;
  let totalDate = null;
  for (let i = 0; i < Math.min(rows.length, 10) && total === null; i++) {
    const r = rows[i] || [];
    for (let j = 0; j < r.length; j++) {
      const label = norm(r[j]);
      if (!RX.totalFollowers.test(label)) continue;
      const fromLabel = String(r[j]).match(/(\d[\d.,]*)\s*$/);
      const next = r.slice(j + 1).find((c) => c !== null && c !== "" && toInt(c) !== null);
      total = toInt(next ?? fromLabel?.[1]);
      totalDate = cellDate(String(r[j]).replace(/[^\d/.-]+/g, " ").trim().split(" ").find((t) => /[/.-]/.test(t)), dmyFallback);
      break;
    }
  }

  const h = findHeaderRow(rows, [RX.date, RX.newFollowers]);
  const daily = [];
  if (h >= 0) {
    const head = rows[h].map(norm);
    const di = head.findIndex((c) => RX.date.test(c));
    const ni = head.findIndex((c) => RX.newFollowers.test(c));
    const body = rows.slice(h + 1);
    const dmy = guessDmy(body.map((r) => r?.[di]), dmyFallback);
    for (const r of body) {
      const day = cellDate(r?.[di], dmy);
      const n = toInt(r?.[ni]);
      if (day && n !== null) daily.push({ day, new_followers: n });
    }
  }
  return { total, totalDate, daily };
}

function parseEngagement(rows, dmyFallback) {
  const h = findHeaderRow(rows, [RX.date, RX.impressions]);
  if (h < 0) return [];
  const head = rows[h].map(norm);
  const di = head.findIndex((c) => RX.date.test(c));
  const ii = head.findIndex((c) => RX.impressions.test(c));
  const ei = head.findIndex((c) => RX.engagements.test(c));
  const body = rows.slice(h + 1);
  const dmy = guessDmy(body.map((r) => r?.[di]), dmyFallback);
  const out = [];
  for (const r of body) {
    const day = cellDate(r?.[di], dmy);
    if (!day) continue;
    out.push({ day, impressions: toInt(r?.[ii]), engagements: ei >= 0 ? toInt(r?.[ei]) : null });
  }
  return out;
}

function parseTopPosts(rows, dmyFallback) {
  const h = findHeaderRow(rows, [RX.url]);
  if (h < 0) return [];
  const head = rows[h].map(norm);
  const posts = new Map();
  head.forEach((c, i) => {
    if (!RX.url.test(c)) return;
    // Bloque: URL | fecha de publicación | métrica (hasta la próxima URL o columna vacía)
    let dateCol = -1;
    let metricCol = -1;
    let metric = null;
    for (let j = i + 1; j < Math.min(head.length, i + 4); j++) {
      if (RX.url.test(head[j])) break;
      if (dateCol < 0 && RX.publishDate.test(head[j]) && !RX.impressions.test(head[j]) && !RX.engagements.test(head[j])) dateCol = j;
      else if (metricCol < 0 && RX.impressions.test(head[j])) [metricCol, metric] = [j, "impressions"];
      else if (metricCol < 0 && RX.engagements.test(head[j])) [metricCol, metric] = [j, "engagements"];
    }
    const body = rows.slice(h + 1);
    const dmy = guessDmy(body.map((r) => r?.[dateCol]), dmyFallback);
    for (const r of body) {
      const url = String(r?.[i] ?? "").trim();
      if (!/^https?:\/\//i.test(url)) continue;
      const key = postKey(url);
      const external_id = key?.startsWith("li:") ? key.slice(3) : url;
      const p = posts.get(external_id) || { external_id, permalink: url, posted_day: null };
      p.posted_day = p.posted_day || (dateCol >= 0 ? cellDate(r?.[dateCol], dmy) : null);
      if (metric) p[metric] = toInt(r?.[metricCol]);
      posts.set(external_id, p);
    }
  });
  return [...posts.values()];
}

function parseDiscovery(rows) {
  const out = {};
  for (const r of rows.slice(0, 20)) {
    for (let j = 0; j < (r || []).length - 1; j++) {
      const label = norm(r[j]);
      const val = toInt(r[j + 1]);
      if (val === null) continue;
      if (RX.impressions.test(label) && out.impressions === undefined) out.impressions = val;
      else if (RX.reached.test(label) && out.members_reached === undefined) out.members_reached = val;
    }
    const period = (r || []).map(String).find((c) => /\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}\s*-\s*\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}/.test(c));
    if (period && !out.period) out.period = period.trim();
  }
  return out;
}

function classify(sheet) {
  const name = norm(sheet.sheet);
  const head = (sheet.data || []).slice(0, 15).flat().map(norm).join(" | ");
  if (/follower|seguidor/.test(name) || RX.newFollowers.test(head)) return "followers";
  if (/top|principal|destacad|post|publicac/.test(name) || (/url/.test(head) && RX.impressions.test(head))) return "posts";
  if (/engagement|interac|engajamento/.test(name)) return "engagement";
  if (/discovery|descubr|descoberta/.test(name)) return "discovery";
  if (/demograph|demograf/.test(name)) return "demographics";
  if (RX.date.test(head.split(" | ")[0] || "") && RX.impressions.test(head)) return "engagement";
  return "other";
}

/**
 * Lee el XLSX y devuelve los datos listos para guardar. Lanza un Error con un
 * mensaje claro si el archivo no parece ser la exportación de LinkedIn.
 */
export async function parseLinkedinExport(buffer) {
  if (!buffer?.length) throw new Error("El archivo está vacío");
  if (buffer.length > MAX_BYTES) throw new Error("El archivo es muy grande (máximo 5 MB)");
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error("No es un archivo .xlsx (exportalo desde LinkedIn en formato Excel)");

  const { default: readExcelFile } = await import("read-excel-file/node");
  const sheets = await readExcelFile(buffer);
  const dmy = looksSpanish(sheets);

  const result = { followers: null, engagement: [], posts: [], discovery: {}, sheets: sheets.map((s) => s.sheet) };
  for (const s of sheets) {
    const rows = s.data || [];
    const kind = classify(s);
    if (kind === "followers" && !result.followers) result.followers = parseFollowers(rows, dmy);
    else if (kind === "engagement" && !result.engagement.length) result.engagement = parseEngagement(rows, dmy);
    else if (kind === "posts" && !result.posts.length) result.posts = parseTopPosts(rows, dmy);
    else if (kind === "discovery") result.discovery = parseDiscovery(rows);
  }

  if (!result.followers?.daily?.length && !result.posts.length && !result.engagement.length) {
    throw new Error(
      `No encontré datos de LinkedIn en el archivo (hojas: ${result.sheets.join(", ") || "ninguna"}). ¿Es la exportación de Analytics del perfil?`
    );
  }
  return result;
}

/**
 * Arma los seguidores por día: LinkedIn da el total a una fecha y los nuevos
 * seguidores de cada día, así que se reconstruye hacia atrás desde el total.
 */
export function followerSeries({ total, totalDate, daily }) {
  if (total === null || total === undefined || !daily?.length) return [];
  const sorted = [...daily].sort((a, b) => (a.day < b.day ? 1 : -1)); // más reciente primero
  const anchor = totalDate && totalDate >= sorted[0].day ? totalDate : sorted[0].day;
  const out = [];
  let current = total;
  // Si el total es de un día posterior al último dato, se guarda también ese día.
  if (anchor > sorted[0].day) out.push({ day: anchor, followers: current, new_followers: null });
  for (const d of sorted) {
    out.push({ day: d.day, followers: current, new_followers: d.new_followers });
    current -= d.new_followers;
  }
  return out;
}
