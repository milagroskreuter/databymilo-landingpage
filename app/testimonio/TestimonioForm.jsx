"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SUGGESTIONS = ["Compré un ebook", "Leo la carta del domingo", "Te sigo en LinkedIn", "Te sigo en Instagram"];
const MAX_TEXT = 1500;

// Achica la foto en el navegador antes de subirla (más rápido y liviano).
// Si el navegador no la puede leer (ej. HEIC en algunas compus), devuelve null.
async function shrinkImage(file, maxSide = 800) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function TestimonioForm({ product }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState(product ? `Compré “${product.title}”` : "");
  const [text, setText] = useState("");
  const [social, setSocial] = useState("");
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState(null); // { blob, preview }
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const startedRef = useRef(0);
  const fileRef = useRef(null);

  useEffect(() => {
    startedRef.current = Date.now();
  }, []);

  useEffect(() => () => photo?.preview && URL.revokeObjectURL(photo.preview), [photo]);

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("La foto tiene que ser una imagen (JPG o PNG).");
      return;
    }
    const blob = await shrinkImage(file);
    if (!blob) {
      setError("No pude leer esa foto. Probá con una JPG o PNG.");
      return;
    }
    setPhoto({ blob, preview: URL.createObjectURL(blob) });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    if (!consent) {
      setError("Marcá la casilla para darme permiso de publicarlo.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("consent", consent ? "true" : "");
    fd.set("started", String(startedRef.current || 0));
    if (product) fd.set("product", product.slug);
    fd.delete("photo");
    if (photo) fd.set("photo", photo.blob, "foto.jpg");

    setStatus("sending");
    try {
      const res = await fetch("/api/testimonials", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo enviar. Probá de nuevo.");
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="mk-comunidad-tform-card mk-comunidad-tform-done">
        <div className="mk-comunidad-tform-badge" aria-hidden="true">🩷</div>
        <h2 className="mk-comunidad-tform-done-title">¡Llegó! Gracias, {name.split(" ")[0] || "de verdad"}.</h2>
        <p>
          Lo voy a leer con un mate en la mano. Antes de publicarlo lo reviso y, si hace falta
          acomodar algo, cuido que siga diciendo lo que vos dijiste.
        </p>
        <Link href="/" className="btn btn-ghost">Volver al inicio →</Link>
      </div>
    );
  }

  return (
    <form className="mk-comunidad-tform-card" onSubmit={onSubmit} noValidate>
      <div className="mk-comunidad-tform-badge" aria-hidden="true">✍️</div>

      {/* Honeypot: invisible para personas. */}
      <div className="mk-comunidad-tform-hp" aria-hidden="true">
        <label>
          Tu web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mk-comunidad-tform-row">
        <div className="mk-comunidad-tform-field">
          <label htmlFor="t-name">Tu nombre</label>
          <input
            id="t-name"
            name="name"
            className="mk-comunidad-tform-input"
            placeholder="Cómo querés que aparezca"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            autoComplete="name"
          />
        </div>

        <div className="mk-comunidad-tform-photo">
          <button
            type="button"
            className={`mk-comunidad-tform-photo-btn${photo ? " has-photo" : ""}`}
            onClick={() => fileRef.current?.click()}
            aria-label={photo ? "Cambiar foto" : "Agregar una foto (opcional)"}
          >
            {photo ? <img src={photo.preview} alt="Tu foto" /> : <span>+ foto</span>}
          </button>
          {photo ? (
            <button type="button" className="mk-comunidad-tform-link" onClick={() => setPhoto(null)}>
              quitar
            </button>
          ) : (
            <span className="mk-comunidad-tform-optional">opcional</span>
          )}
          <input ref={fileRef} type="file" name="photo" accept="image/*" hidden onChange={onPickPhoto} />
        </div>
      </div>

      <div className="mk-comunidad-tform-field">
        <label htmlFor="t-relation">¿Cómo me conociste o qué compraste?</label>
        <input
          id="t-relation"
          name="relation"
          className="mk-comunidad-tform-input"
          placeholder="Ej. Compré el ebook de stakeholders"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          maxLength={140}
        />
        <div className="mk-comunidad-tform-chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`mk-comunidad-tform-chip${relation === s ? " is-on" : ""}`}
              onClick={() => setRelation(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mk-comunidad-tform-field">
        <label htmlFor="t-text">Tu testimonio</label>
        <textarea
          id="t-text"
          name="text"
          className="mk-comunidad-tform-input mk-comunidad-tform-textarea"
          placeholder="¿Qué te llevaste? ¿Qué cambió después? Con tus palabras, sin vueltas."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT}
          rows={5}
          required
        />
        <div className="mk-comunidad-tform-count">{text.length}/{MAX_TEXT}</div>
      </div>

      <div className="mk-comunidad-tform-field">
        <label htmlFor="t-social">
          Link a tu LinkedIn o Instagram <span className="mk-comunidad-tform-optional">opcional</span>
        </label>
        <input
          id="t-social"
          name="social_url"
          className="mk-comunidad-tform-input"
          placeholder="linkedin.com/in/tu-nombre"
          value={social}
          onChange={(e) => setSocial(e.target.value)}
          maxLength={300}
          inputMode="url"
        />
      </div>

      <label className="mk-comunidad-tform-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Te doy permiso para publicar este testimonio con mi nombre{photo ? ", mi foto" : ""}
          {social ? " y el link a mi red" : ""} en databymilo.me y en tus redes.
        </span>
      </label>

      {error && <p className="mk-comunidad-tform-error" role="alert">{error}</p>}

      <button type="submit" className="mk-comunidad-tform-submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando…" : "Enviar mi testimonio"}
      </button>
      <p className="mk-comunidad-tform-micro">Lo leo yo antes de publicarlo. Tu mail no hace falta.</p>
    </form>
  );
}
