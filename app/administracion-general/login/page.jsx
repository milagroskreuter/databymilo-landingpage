"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../admin.css";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/administracion-general");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al iniciar sesión");
    }
    setLoading(false);
  }

  return (
    <div className="adm-login-wrapper">
      <div className="adm-login-box">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a07080", marginBottom: 8 }}>
            Data by Milo
          </div>
          <h1 className="adm-login-title">Admin</h1>
          <p className="adm-login-sub">Solo vos podés entrar acá.</p>
        </div>

        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="adm-form-group">
            <label className="adm-label">Contraseña</label>
            <input
              type="password"
              className="adm-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading || !password}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
