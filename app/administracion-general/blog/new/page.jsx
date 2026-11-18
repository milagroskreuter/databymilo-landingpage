"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TEMPLATE = `Acá va el primer párrafo de introducción.

Segundo párrafo con el desarrollo.

Una idea más que amplía el tema.

Cierre o reflexión final.`;

export default function NewBlogPost() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    excerpt: "",
    tags: "",
    coverImage: "",
    content: TEMPLATE,
    slug: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      slug: form.slug || undefined,
    };

    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/administracion-general/blog");
    } else {
      setMsg({ type: "error", text: data.error || "Error al guardar" });
    }
    setLoading(false);
  }

  return (
    <>
      <div className="adm-header">
        <h1>Nueva entrada de blog</h1>
        <Link href="/administracion-general/blog" className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
      </div>

      <div className="adm-content">
        {msg && <div className={`adm-alert adm-alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSave}>
          <div className="adm-editor-grid">
            <div>
              <div className="adm-form-group">
                <label className="adm-label">Título *</label>
                <input className="adm-input" value={form.title} onChange={(e) => update("title", e.target.value)} required placeholder="El título del post" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Fecha</label>
                <input type="date" className="adm-input" value={form.date} onChange={(e) => update("date", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Resumen (excerpt)</label>
                <textarea className="adm-textarea" style={{ minHeight: 80 }} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Dos líneas que resumen el post" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Tags (separados por coma)</label>
                <input className="adm-input" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="datos, ia, corpo" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Imagen de portada (URL o /path)</label>
                <input className="adm-input" value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} placeholder="/cover.jpg" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Slug personalizado (opcional)</label>
                <input className="adm-input" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="se genera desde el título si lo dejás vacío" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !form.title}>
                  {loading ? "Guardando…" : "Guardar post"}
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
                <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 6 }}>
                  Formato MDX. Podés usar **negrita**, *cursiva*, ## títulos, [links](url), etc.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
