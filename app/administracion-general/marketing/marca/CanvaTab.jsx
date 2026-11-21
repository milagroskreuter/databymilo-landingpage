"use client";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../AdminToast";
import { API, api, copyText } from "./api";

const SCOPES = [
  "profile:read",
  "design:meta:read",
  "design:content:read",
  "design:content:write",
  "brandtemplate:meta:read",
  "brandtemplate:content:read",
  "asset:read",
];

function Setup({ redirectUri }) {
  const toast = useToast();
  return (
    <div className="adm-card mk-marca-section mk-marca-setup">
      <h2 className="mk-marca-h2">Conectar Canva</h2>
      <p className="mk-marca-hint">Falta crear la integración de Canva Connect. Es gratis y se hace una sola vez:</p>
      <ol>
        <li>
          Entrá a{" "}
          <a href="https://www.canva.com/developers/integrations" target="_blank" rel="noopener noreferrer">
            canva.com/developers/integrations
          </a>{" "}
          con tu cuenta de Canva Pro y tocá <strong>Create an integration</strong> → <strong>Private</strong> (solo para vos).
        </li>
        <li>
          En <strong>Scopes</strong>, activá: {SCOPES.map((s) => <code key={s}>{s} </code>)}
        </li>
        <li>
          En <strong>Authentication → Redirect URLs</strong>, agregá:{" "}
          <code>{redirectUri || "https://databymilo.me/api/admin/marketing/brand/canva/callback"}</code>{" "}
          <button className="adm-link-btn" onClick={async () => (await copyText(redirectUri)) && toast({ text: "URL copiada" })}>
            Copiar
          </button>
          <br />
          <span className="mk-marca-hint">Para probar en tu compu, agregá también la de 127.0.0.1 (Canva no acepta &quot;localhost&quot;).</span>
        </li>
        <li>
          Copiá el <strong>Client ID</strong> y generá un <strong>Client secret</strong>. En Vercel agregá <code>CANVA_CLIENT_ID</code> y <code>CANVA_CLIENT_SECRET</code>, y
          volvé a deployar.
        </li>
        <li>Volvé a esta pestaña y tocá Conectar.</li>
      </ol>
      <p className="mk-marca-hint">
        Con Canva Pro podés listar y exportar tus diseños y crear diseños desde plantillas de marca con datos (autofill).
      </p>
    </div>
  );
}

function BrandTemplates() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [notice, setNotice] = useState("");
  const [sel, setSel] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api("canva/templates")
      .then((d) => {
        setList(d.templates || []);
        if (d.unavailable) setNotice(d.message);
      })
      .catch((e) => {
        setList([]);
        setNotice(e.message);
      });
  }, []);

  async function pick(t) {
    setSel(t);
    setCreated(null);
    setFields([]);
    setValues({});
    setTitle(t.title);
    try {
      setFields((await api(`canva/templates?id=${encodeURIComponent(t.id)}`)).fields);
    } catch (e) {
      toast({ type: "error", text: e.message });
    }
  }

  async function create() {
    setBusy(true);
    try {
      const { design } = await api("canva/autofill", { method: "POST", body: { templateId: sel.id, title, data: values } });
      setCreated(design);
      toast({ text: "Diseño creado en Canva" });
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const textFields = fields.filter((f) => f.type === "text");

  return (
    <section className="adm-card mk-marca-section">
      <h2 className="mk-marca-h2">Crear desde una plantilla de marca</h2>
      <p className="mk-marca-hint">
        En Canva, publicá un diseño como plantilla de marca y poné nombres a los campos de texto con la app &quot;Bulk create&quot; o &quot;Data autofill&quot;.
        Acá completás los textos y Canva arma el diseño.
      </p>
      {notice && <div className="adm-alert adm-alert-info">{notice}</div>}
      {list === null ? (
        <p className="mk-marca-hint">Cargando plantillas…</p>
      ) : list.length === 0 ? (
        !notice && <p className="mk-marca-hint">No encontré plantillas de marca en tu cuenta.</p>
      ) : (
        <div className="mk-marca-canva-grid">
          {list.map((t) => (
            <button key={t.id} className={`mk-marca-card${sel?.id === t.id ? " is-open" : ""}`} onClick={() => pick(t)}>
              <div className="mk-marca-card-img">{t.thumbnail ? <img src={t.thumbnail} alt={t.title} loading="lazy" /> : null}</div>
              <div className="mk-marca-card-body">
                <span className="mk-marca-card-name">{t.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {sel && (
        <div className="mk-marca-stack">
          <label className="adm-form-group">
            <span className="adm-label">Título del diseño nuevo</span>
            <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          {fields.length > 0 && textFields.length === 0 && <p className="mk-marca-hint">Esta plantilla no tiene campos de texto para completar.</p>}
          {textFields.map((f) => (
            <label key={f.name} className="adm-form-group">
              <span className="adm-label">{f.name}</span>
              <textarea className="adm-textarea mk-marca-ta" rows={2} value={values[f.name] || ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
            </label>
          ))}
          <div className="mk-marca-row">
            <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={create} disabled={busy || !textFields.length}>
              {busy ? "Creando…" : "Crear diseño en Canva"}
            </button>
            {created?.url && (
              <a className="adm-btn adm-btn-secondary adm-btn-sm" href={created.url} target="_blank" rel="noopener noreferrer">
                Abrir en Canva ↗
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function CanvaTab() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [cont, setCont] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState({});
  const [flash, setFlash] = useState(null);

  const load = useCallback(
    async (more = false) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({ designs: "1" });
        if (q) sp.set("q", q);
        if (more && cont) sp.set("continuation", cont);
        const d = await api(`canva?${sp}`);
        setStatus(d);
        setDesigns((list) => (more ? [...list, ...(d.designs || [])] : d.designs || []));
        setCont(d.continuation || null);
      } catch (e) {
        setStatus((s) => s || { configured: true, connected: true });
        toast({ type: "error", text: e.message });
      } finally {
        setLoading(false);
      }
    },
    [q, cont, toast]
  );

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("canva");
    if (c === "ok") setFlash({ type: "success", text: "Canva quedó conectado." });
    if (c === "error") setFlash({ type: "error", text: `No se pudo conectar Canva: ${sp.get("msg") || "error desconocido"}` });
    if (c === "sin-config") setFlash({ type: "error", text: "Faltan las variables CANVA_CLIENT_ID y CANVA_CLIENT_SECRET." });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function exportDesign(d) {
    setExporting((s) => ({ ...s, [d.id]: true }));
    try {
      const { assets } = await api("canva/export", { method: "POST", body: { designId: d.id, title: d.title } });
      toast({ text: assets.length === 1 ? "PNG guardado en la biblioteca" : `${assets.length} páginas guardadas en la biblioteca` });
    } catch (e) {
      toast({ type: "error", text: e.message });
    } finally {
      setExporting((s) => ({ ...s, [d.id]: false }));
    }
  }

  async function disconnect() {
    if (!confirm("¿Desconectar Canva? Vas a tener que volver a autorizar.")) return;
    await api("canva", { method: "DELETE" }).catch(() => {});
    setDesigns([]);
    load();
  }

  if (!status) return <p className="mk-marca-hint">Cargando…</p>;

  return (
    <div className="mk-marca-stack">
      {flash && <div className={`adm-alert adm-alert-${flash.type}`}>{flash.text}</div>}
      {!status.configured ? (
        <Setup redirectUri={status.redirectUri} />
      ) : !status.connected ? (
        <div className="adm-card mk-marca-section">
          <h2 className="mk-marca-h2">Conectá tu cuenta de Canva</h2>
          <p className="mk-marca-hint">Te lleva a Canva para autorizar el acceso y vuelve acá.</p>
          <div>
            <a className="adm-btn adm-btn-primary" href={`${API}/canva/connect`}>
              Conectar Canva
            </a>
          </div>
          <p className="mk-marca-hint">
            Si Canva dice que la URL de retorno no coincide, agregá esta en la integración: <code>{status.redirectUri}</code>
          </p>
        </div>
      ) : (
        <>
          <div className="mk-marca-row mk-marca-wrap">
            <span className="mk-marca-hint">
              Conectado{status.displayName ? ` como ${status.displayName}` : ""}.
            </span>
            <button className="adm-link-btn mk-marca-danger mk-marca-push" onClick={disconnect}>
              Desconectar
            </button>
          </div>
          <section className="adm-card mk-marca-section">
            <h2 className="mk-marca-h2">Tus diseños</h2>
            <form
              className="adm-toolbar"
              onSubmit={(e) => {
                e.preventDefault();
                load();
              }}
            >
              <input className="adm-search" placeholder="Buscar diseños…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="adm-btn adm-btn-secondary adm-btn-sm" type="submit" disabled={loading}>
                Buscar
              </button>
            </form>
            {designs.length === 0 && !loading ? (
              <p className="mk-marca-hint">No hay diseños.</p>
            ) : (
              <div className="mk-marca-canva-grid">
                {designs.map((d) => (
                  <div key={d.id} className="mk-marca-card is-static">
                    <div className="mk-marca-card-img">{d.thumbnail ? <img src={d.thumbnail} alt={d.title} loading="lazy" /> : null}</div>
                    <div className="mk-marca-card-body">
                      <span className="mk-marca-card-name">{d.title}</span>
                      <span className="mk-marca-card-tags">
                        {d.pages ? `${d.pages} pág. · ` : ""}
                        {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("es-AR") : ""}
                      </span>
                      <div className="mk-marca-row mk-marca-wrap">
                        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => exportDesign(d)} disabled={exporting[d.id]}>
                          {exporting[d.id] ? "Exportando…" : "PNG a biblioteca"}
                        </button>
                        {d.editUrl && (
                          <a className="adm-link-btn" href={d.editUrl} target="_blank" rel="noopener noreferrer">
                            Abrir ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cont && (
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => load(true)} disabled={loading}>
                {loading ? "Cargando…" : "Ver más"}
              </button>
            )}
          </section>
          <BrandTemplates />
        </>
      )}
    </div>
  );
}
