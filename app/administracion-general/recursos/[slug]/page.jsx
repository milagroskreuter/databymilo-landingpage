"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function EditRecursoPage() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/recursos/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || "",
          type: data.type || "",
          pages: data.pages || "",
          desc: data.desc || "",
          color: data.color || "#fadbe8",
          href: data.href || "",
          isPaid: data.isPaid || false,
          price: data.price || "",
          priceNote: data.priceNote || "",
          paymentUrl: data.paymentUrl || "",
          badge: data.badge || "",
          forWho: data.forWho || "",
          note: data.note || "",
          bullets: [...(data.bullets || []), "", "", "", "", ""].slice(0, 5),
        });
      });
  }, [slug]);

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function updateBullet(i, val) {
    setForm((f) => { const b = [...f.bullets]; b[i] = val; return { ...f, bullets: b }; });
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const payload = { ...form, bullets: form.bullets.filter(Boolean) };

    const res = await fetch(`/api/admin/recursos/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) setMsg({ type: "success", text: "Recurso guardado ✦" });
    else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "error", text: data.error || "Error al guardar" });
    }
    setLoading(false);
  }

  if (!form) return (
    <>
      <div className="adm-header"><h1>Editar recurso</h1></div>
      <div className="adm-content" style={{ color: "var(--adm-text-muted)" }}>Cargando…</div>
    </>
  );

  return (
    <>
      <div className="adm-header">
        <div>
          <h1>Editar recurso</h1>
          <div style={{ fontSize: 12, color: "var(--adm-text-muted)", marginTop: 2 }}>{slug}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/recursos/${slug}`} target="_blank" className="adm-btn adm-btn-secondary adm-btn-sm">Ver</Link>
          <Link href="/administracion-general/recursos" className="adm-btn adm-btn-secondary adm-btn-sm">← Volver</Link>
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
                <label className="adm-label">Tipo</label>
                <input className="adm-input" value={form.type} onChange={(e) => update("type", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Páginas</label>
                <input className="adm-input" value={form.pages} onChange={(e) => update("pages", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Descripción</label>
                <textarea className="adm-textarea" style={{ minHeight: 80 }} value={form.desc} onChange={(e) => update("desc", e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Color de fondo</label>
                <input className="adm-input" value={form.color} onChange={(e) => update("color", e.target.value)} />
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
                    <input className="adm-input" value={form.price} onChange={(e) => update("price", e.target.value)} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">URL de pago</label>
                    <input className="adm-input" value={form.paymentUrl} onChange={(e) => update("paymentUrl", e.target.value)} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Badge</label>
                    <input className="adm-input" value={form.badge} onChange={(e) => update("badge", e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="adm-form-group">
                  <label className="adm-label">Href / PDF</label>
                  <input className="adm-input" value={form.href} onChange={(e) => update("href", e.target.value)} />
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={loading || !form.title}>
                  {loading ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/administracion-general/recursos" className="adm-btn adm-btn-secondary">Cancelar</Link>
              </div>
            </div>
            <div>
              <div className="adm-form-group">
                <label className="adm-label">Bullets</label>
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
