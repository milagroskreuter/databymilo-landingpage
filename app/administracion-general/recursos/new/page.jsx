"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewRecursoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", type: "", pages: "", desc: "", color: "#fadbe8",
    href: "", slug: "", isPaid: false, price: "", priceNote: "",
    paymentUrl: "", badge: "", forWho: "", note: "",
    bullets: ["", "", "", "", ""],
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function updateBullet(i, val) {
    setForm((f) => { const b = [...f.bullets]; b[i] = val; return { ...f, bullets: b }; });
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const payload = {
      ...form,
      bullets: form.bullets.filter(Boolean),
      slug: form.slug || form.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
    };

    const res = await fetch("/api/admin/recursos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) router.push("/administracion-general/recursos");
    else { setMsg({ type: "error", text: data.error || "Error al guardar" }); setLoading(false); }
  }

  return (
    <>
      <div className="adm-header">
        <h1>Nuevo recurso</h1>
        <Link href="/administracion-general/recursos" className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
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
                <label className="adm-label">Tipo (ej: Guía · PDF)</label>
                <input className="adm-input" value={form.type} onChange={(e) => update("type", e.target.value)} placeholder="Guía · PDF" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Páginas</label>
                <input className="adm-input" value={form.pages} onChange={(e) => update("pages", e.target.value)} placeholder="17 páginas" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Descripción corta</label>
                <textarea className="adm-textarea" style={{ minHeight: 80 }} value={form.desc} onChange={(e) => update("desc", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Color de fondo (hex)</label>
                <input className="adm-input" value={form.color} onChange={(e) => update("color", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Slug personalizado</label>
                <input className="adm-input" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="se genera desde el título" />
              </div>

              <div className="adm-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isPaid} onChange={(e) => update("isPaid", e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span className="adm-label" style={{ margin: 0 }}>Es recurso pago</span>
                </label>
              </div>

              {form.isPaid ? (
                <>
                  <div className="adm-form-group">
                    <label className="adm-label">Precio</label>
                    <input className="adm-input" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="USD 15" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Nota de precio</label>
                    <input className="adm-input" value={form.priceNote} onChange={(e) => update("priceNote", e.target.value)} placeholder="Precio de lanzamiento" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">URL de pago</label>
                    <input className="adm-input" value={form.paymentUrl} onChange={(e) => update("paymentUrl", e.target.value)} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Badge</label>
                    <input className="adm-input" value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Nueva guía" />
                  </div>
                </>
              ) : (
                <div className="adm-form-group">
                  <label className="adm-label">Href / ruta del PDF</label>
                  <input className="adm-input" value={form.href} onChange={(e) => update("href", e.target.value)} placeholder="/mi-recurso.pdf" />
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !form.title}>
                  {loading ? "Guardando…" : "Guardar recurso"}
                </button>
                <Link href="/administracion-general/recursos" className="adm-btn adm-btn-secondary">Cancelar</Link>
              </div>
            </div>

            <div>
              <div className="adm-form-group">
                <label className="adm-label">Bullets (qué incluye)</label>
                {form.bullets.map((b, i) => (
                  <input key={i} className="adm-input" value={b} onChange={(e) => updateBullet(i, e.target.value)} placeholder={`Punto ${i + 1}`} style={{ marginBottom: 8 }} />
                ))}
              </div>
              <div className="adm-form-group">
                <label className="adm-label">¿Para quién es?</label>
                <textarea className="adm-textarea" value={form.forWho} onChange={(e) => update("forWho", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Nota personal</label>
                <textarea className="adm-textarea" value={form.note} onChange={(e) => update("note", e.target.value)} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
