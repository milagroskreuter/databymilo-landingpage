"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "../AdminToast";

export default function BlogAdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [linkCheck, setLinkCheck] = useState(null);
  const [linkChecking, setLinkChecking] = useState(false);
  const toast = useToast();

  async function handleDuplicate(slug, title) {
    const res = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicate_slug: slug }) });
    if (res.ok) { toast({ type: "success", text: `"${title}" duplicada ✓` }); load(); }
    else toast({ type: "error", text: "Error al duplicar" });
  }

  async function handleCheckLinks() {
    setLinkChecking(true); setLinkCheck(null);
    const res = await fetch("/api/admin/blog/check-links");
    if (res.ok) { const d = await res.json(); setLinkCheck(d); }
    else setLinkCheck({ error: true });
    setLinkChecking(false);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(slug, title) {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", text: `"${title}" eliminada ✓` });
      load();
    } else {
      toast({ type: "error", text: "Error al eliminar" });
    }
  }

  const posts = data?.posts ?? [];

  return (
    <>
      <div className="adm-header">
        <h1>Blog</h1>
        <div style={{ display:"flex", gap:8 }}>
          <button className="adm-btn adm-btn-secondary" onClick={handleCheckLinks} disabled={linkChecking}>
            {linkChecking ? "Verificando…" : "🔗 Revisar links"}
          </button>
          <Link href="/administracion-general/blog/new" className="adm-btn adm-btn-primary">+ Nueva entrada</Link>
        </div>
      </div>

      <div className="adm-content">
        {linkCheck && !linkCheck.error && (
          <div className="adm-card" style={{ marginBottom:16, padding:16 }}>
            <div style={{ fontWeight:700, fontSize:13, fontFamily:"var(--adm-font-body)", marginBottom:8 }}>
              🔗 Resultado de verificación de links
            </div>
            {linkCheck.broken?.length === 0 ? (
              <div style={{ color:"#1a7a4a", fontSize:13 }}>✓ No se encontraron links rotos en {linkCheck.checked} URLs verificadas.</div>
            ) : (
              <div>
                <div style={{ color:"#c0392b", fontSize:13, marginBottom:8 }}>{linkCheck.broken?.length} link(s) rotos de {linkCheck.checked} verificados:</div>
                {linkCheck.broken?.map((b, i) => (
                  <div key={i} style={{ fontSize:12, padding:"4px 8px", background:"#fff5f5", borderRadius:4, marginBottom:4, fontFamily:"monospace" }}>
                    <span style={{ color:"#c0392b", fontWeight:700 }}>[{b.status}]</span> <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color:"var(--adm-primary)" }}>{b.url}</a>
                    <span style={{ color:"var(--adm-fg-muted)", marginLeft:8, fontFamily:"var(--adm-font-body)" }}>en "{b.post}"</span>
                  </div>
                ))}
              </div>
            )}
            <button className="adm-btn adm-btn-secondary adm-btn-sm" style={{ marginTop:8 }} onClick={() => setLinkCheck(null)}>Cerrar</button>
          </div>
        )}

        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--adm-text-muted)" }}>Cargando…</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ color: "var(--adm-text-muted)", marginBottom: 16 }}>No hay posts todavía</div>
              <Link href="/administracion-general/blog/new" className="adm-btn adm-btn-primary">Crear el primero</Link>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Lectura</th>
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
                    <td>
                      {p.publish_at && !p.published ? (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#ede9fe", color:"#7c3aed", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                          ⏰ {new Date(p.publish_at).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}
                        </span>
                      ) : p.published ? (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#d1fae5", color:"#065f46", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                          ✓ Publicada
                        </span>
                      ) : (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"var(--adm-tinted)", color:"var(--adm-fg-muted)", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                          ✎ Borrador
                        </span>
                      )}
                    </td>
                    <td style={{ color: "var(--adm-fg-muted)", fontSize:12, whiteSpace:"nowrap" }}>
                      {p.word_count > 0 ? `${Math.max(1, Math.round(p.word_count / 200))} min` : "—"}
                    </td>
                    <td style={{ color: "var(--adm-fg-muted)", whiteSpace: "nowrap" }}>
                      {p.date || "—"}
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
                        <Link href={`/blog/${p.slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">Ver</Link>
                        <Link href={`/administracion-general/blog/${p.slug}`} className="adm-btn adm-btn-secondary adm-btn-sm">Editar</Link>
                        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => handleDuplicate(p.slug, p.title)}>Duplicar</button>
                        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(p.slug, p.title)}>Eliminar</button>
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
