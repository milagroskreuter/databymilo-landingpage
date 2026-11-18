"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BlogAdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(slug, title) {
    if (!confirm(`Â¿Eliminar "${title}"? Esta acciÃ³n no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: `"${title}" eliminado` });
      load();
    } else {
      setMsg({ type: "error", text: "Error al eliminar" });
    }
  }

  const posts = data?.posts ?? [];

  return (
    <>
      <div className="adm-header">
        <h1>Blog</h1>
        <Link href="/administracion-general/blog/new" className="adm-btn adm-btn-primary">
          + Nueva entrada
        </Link>
      </div>

      <div className="adm-content">
        {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-text-muted)" }}>Cargandoâ€¦</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ color: "var(--adm-text-muted)", marginBottom: 16 }}>No hay posts todavÃ­a</div>
              <Link href="/administracion-general/blog/new" className="adm-btn adm-btn-primary">Crear el primero</Link>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>TÃ­tulo</th>
                  <th>Fecha</th>
                  <th>Tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.slug}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2 }}>/{p.slug}</div>
                    </td>
                    <td style={{ color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                      {p.date || "â€”"}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(p.tags ?? []).map((t) => (
                          <span key={t} className="adm-badge adm-badge-primary">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link href={`/blog/${p.slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">
                          Ver
                        </Link>
                        <Link href={`/administracion-general/blog/${p.slug}`} className="adm-btn adm-btn-secondary adm-btn-sm">
                          Editar
                        </Link>
                        <button
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          onClick={() => handleDelete(p.slug, p.title)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
