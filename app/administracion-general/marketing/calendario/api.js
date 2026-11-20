// Llamadas del navegador a /api/admin/marketing/* (calendario, ideas, resumen).

export async function mkFetch(url, { method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

const BASE = "/api/admin/marketing";

export const api = {
  listContent: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return mkFetch(`${BASE}/content${qs ? `?${qs}` : ""}`).then((r) => r.items);
  },
  createContent: (data) => mkFetch(`${BASE}/content`, { method: "POST", body: data }).then((r) => r.item),
  updateContent: (id, data) => mkFetch(`${BASE}/content/${id}`, { method: "PATCH", body: data }).then((r) => r.item),
  deleteContent: (id) => mkFetch(`${BASE}/content/${id}`, { method: "DELETE" }),
  summary: () => mkFetch(`${BASE}/content/summary`),

  listPillars: () => mkFetch(`${BASE}/pillars`).then((r) => r.items),
  createPillar: (data) => mkFetch(`${BASE}/pillars`, { method: "POST", body: data }).then((r) => r.item),
  updatePillar: (id, data) => mkFetch(`${BASE}/pillars/${id}`, { method: "PATCH", body: data }).then((r) => r.item),
  deletePillar: (id) => mkFetch(`${BASE}/pillars/${id}`, { method: "DELETE" }),

  listSeries: () => mkFetch(`${BASE}/series`).then((r) => r.items),
  createSeries: (data) => mkFetch(`${BASE}/series`, { method: "POST", body: data }).then((r) => r.item),
  updateSeries: (id, data) => mkFetch(`${BASE}/series/${id}`, { method: "PATCH", body: data }).then((r) => r.item),
  deleteSeries: (id) => mkFetch(`${BASE}/series/${id}`, { method: "DELETE" }),
  generateSeries: (id, weeks) => mkFetch(`${BASE}/series/${id}/generate`, { method: "POST", body: { weeks } }),
};
