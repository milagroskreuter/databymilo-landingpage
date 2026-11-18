"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RecursosAdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/recursos");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(slug, title) {
    if (!confirm(`Â¿Eliminar "${title}"?`)) return;
    const res = await fetch(`/api/admin/recursos/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: `"${title}" eliminado` });
      load();
    } else {
      setMsg({ type: "error", text: "Error al eliminar" });
    }
  }

  const all = [...(data?.free ?? []).map((r) => ({ ...r, isPaid: false })), ...(data?.paid ?? []).map((r) => ({ ...r, isPaid: true }))];

  return (
    <>
      <div className="adm-header">
        <h1>Recursos</h1>
        <Link href="/administracion-general/recursos/new" className="adm-btn adm-btn-primary">+ Nuevo recurso</Link>
      </div>

      <div className="adm-content">
        {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-text-muted)" }}>Cargandoâ€¦</div>
          ) : all.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ color: "var(--adm-text-muted)", marginBottom: 16 }}>No hay recursos</div>
              <Link href="/administracion-general/recursos/new" className="adm-btn adm-btn-primary">Crear el primero</Link>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>TÃ­tulo</th>
                  <th>Tipo</th>
                  <th>CategorÃ­a</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => (
                  <tr key={r.slug}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 2 }}>{r.slug}</div>
                    </td>
                    <td style={{ color: "var(--adm-text-muted)" }}>{r.type || "â€”"}</td>
                    <td>
                      <span className={`adm-badge ${r.isPaid ? "adm-badge-primary" : "adm-badge-active"}`}>
                        {r.isPaid ? "Pago" : "Gratuito"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link href={`/recursos/${r.slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">Ver</Link>
                        <Link href={`/administracion-general/recursos/${r.slug}`} className="adm-btn adm-btn-secondary adm-btn-sm">Editar</Link>
                        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(r.slug, r.title)}>Eliminar</button>
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
