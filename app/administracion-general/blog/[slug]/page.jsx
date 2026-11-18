"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditBlogPost() {
  const { slug } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || "",
          date: data.date || "",
          excerpt: data.excerpt || "",
          tags: (data.tags || []).join(", "),
          coverImage: data.coverImage || "",
          content: data.content || "",
        });
      });
  }, [slug]);

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const res = await fetch(`/api/admin/blog/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMsg({ type: "success", text: "Post guardado ✦" });
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "error", text: data.error || "Error al guardar" });
    }
    setLoading(false);
  }

  if (!form) {
    return (
      <>
        <div className="adm-header"><h1>Editar post</h1></div>
        <div className="adm-content" style={{ color: "var(--adm-text-muted)" }}>Cargando…</div>
      </>
    );
  }

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Editar post</h1>
          <div style={{ fontSize: 12, color: "var(--adm-text-muted)", marginTop: 2 }}>{slug}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/blog/${slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">Ver</Link>
          <Link href="/administracion-general/blog" className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
        </div>
      </div>

      <div className="adm-content">
        {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSave}>
          <div className="adm-editor-grid">
            <div>
              <div className="adm-form-group">
                <label className="adm-label">Título *</label>
                <input className="adm-input" value={form.title} onChange={(e) => update("title", e.target.value)} required />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Fecha</label>
                <input type="date" className="adm-input" value={form.date} onChange={(e) => update("date", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Resumen (excerpt)</label>
                <textarea className="adm-textarea" style={{ minHeight: 80 }} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Tags (separados por coma)</label>
                <input className="adm-input" value={form.tags} onChange={(e) => update("tags", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Imagen de portada</label>
                <input className="adm-input" value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !form.title}>
                  {loading ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/administracion-general/blog" className="adm-btn adm-btn-secondary">Cancelar</Link>
              </div>
            </div>

            <div>
              <div className="adm-form-group">
                <label className="adm-label">Contenido MDX</label>
                <textarea
                  className="adm-textarea code"
                  value={form.content}
                  onChange={(e) => update("content", e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
