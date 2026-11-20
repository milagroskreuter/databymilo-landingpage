"use client";
import { useState } from "react";

function Copy({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <span className="mk-metricas-copy">
      <code>{text}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => {
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          });
        }}
      >
        {ok ? "Copiado" : "Copiar"}
      </button>
    </span>
  );
}

function Status({ ok }) {
  return <span className={`mk-metricas-pill mk-metricas-pill-${ok ? "ok" : "off"}`}>{ok ? "Listo" : "Falta"}</span>;
}

// Pasos para conectar cada red, en lenguaje simple.
export default function ComoConectar({ accounts, env }) {
  const uri = (n) => accounts.find((a) => a.network === n)?.redirect_uri || "";
  return (
    <section className="adm-card mk-metricas-section" id="como-conectar">
      <div className="mk-metricas-section-head">
        <h2 className="adm-card-title">Cómo conectar</h2>
      </div>
      <p className="mk-metricas-muted">
        Las variables se cargan en Vercel → proyecto <strong>databymilo-landingpage</strong> → Settings → Environment Variables
        (marcá Production). Después de agregarlas hay que volver a deployar (Deployments → ⋯ → Redeploy) para que se usen.
      </p>

      <details className="mk-metricas-guide">
        <summary>
          Instagram (cuenta Creador) <Status ok={env.instagram} />
        </summary>
        <ol>
          <li>
            Entrá a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a> con
            tu cuenta de Facebook y tocá <strong>Crear app</strong>.
          </li>
          <li>
            En “caso de uso” elegí <strong>Administrar mensajes y contenido en Instagram</strong> (Instagram API). Si te pregunta el tipo, elegí{" "}
            <strong>Negocios</strong>. Ponele de nombre algo como “Data by Milo métricas”.
          </li>
          <li>
            En el panel de la app andá a <strong>Instagram → Configuración de la API con inicio de sesión de Instagram</strong>. En{" "}
            <strong>Configurar el inicio de sesión para empresas</strong>, pegá esta URL en “URL de redireccionamiento de OAuth”:
            <br />
            <Copy text={uri("instagram")} />
          </li>
          <li>
            En esa misma pantalla vas a ver el <strong>Identificador de la app de Instagram</strong> y la <strong>Clave secreta de la app de Instagram</strong>{" "}
            (ojo: no son los de Facebook que aparecen arriba). Cargalos en Vercel como <code>INSTAGRAM_APP_ID</code> y <code>INSTAGRAM_APP_SECRET</code>.
          </li>
          <li>
            Mientras la app esté “en desarrollo”, solo pueden conectarla las cuentas con un rol. En <strong>Roles de la app → Roles</strong> agregá tu
            cuenta de Instagram como <strong>Evaluador de Instagram</strong> y aceptá la invitación desde Instagram (Configuración → Apps y sitios web →
            Invitaciones de evaluador). No hace falta pasar por la revisión de Meta para usarla con tu propia cuenta.
          </li>
          <li>
            Redeployá en Vercel y tocá <strong>Conectar Instagram</strong> arriba. El token dura 60 días y se renueva solo cada día que corre la lectura
            automática; si algo falla, te llega un aviso.
          </li>
        </ol>
      </details>

      <details className="mk-metricas-guide">
        <summary>
          Threads <Status ok={env.threads} />
        </summary>
        <ol>
          <li>
            En <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a> creá otra
            app y elegí el caso de uso <strong>Acceder a la API de Threads</strong>.
          </li>
          <li>
            En <strong>Casos de uso → Personalizar</strong> activá los permisos <code>threads_basic</code> y <code>threads_manage_insights</code>.
          </li>
          <li>
            En <strong>Configuración</strong> del caso de uso pegá esta URL en “URL de devolución de llamada de redireccionamiento” (y, si te pide las de
            desinstalar y eliminar, podés usar <code>https://databymilo.me</code>):
            <br />
            <Copy text={uri("threads")} />
          </li>
          <li>
            Copiá el <strong>Identificador de la app de Threads</strong> y la <strong>Clave secreta de la app de Threads</strong> y cargalos en Vercel
            como <code>THREADS_APP_ID</code> y <code>THREADS_APP_SECRET</code>.
          </li>
          <li>
            En <strong>Roles de la app</strong> agregá tu usuario como <strong>Evaluador de Threads</strong> y aceptá la invitación en Threads (web:
            Configuración → Cuenta → Permisos de sitios web → Invitaciones).
          </li>
          <li>Redeployá y tocá <strong>Conectar Threads</strong>. El token también dura 60 días y se renueva solo.</li>
        </ol>
      </details>

      <details className="mk-metricas-guide">
        <summary>
          YouTube <Status ok={env.youtube} />
        </summary>
        <ol>
          <li>
            Entrá a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">console.cloud.google.com</a> y creá un
            proyecto (por ejemplo “databymilo”).
          </li>
          <li>
            En <strong>APIs y servicios → Biblioteca</strong> buscá <strong>YouTube Data API v3</strong> y tocá <strong>Habilitar</strong>.
          </li>
          <li>
            En <strong>APIs y servicios → Credenciales → Crear credenciales → Clave de API</strong>. Después editala y en “Restricciones de API”
            elegí solo YouTube Data API v3.
          </li>
          <li>
            Cargala en Vercel como <code>YOUTUBE_API_KEY</code> y redeployá. Es gratis: la lectura diaria usa unas 3 unidades de las 10.000 por día.
          </li>
          <li>
            Volvé acá y escribí tu <strong>@usuario</strong> de YouTube en la tarjeta. Listo: suscriptores y vistas de cada video se leen solos.
            (YouTube redondea los suscriptores públicos, por ejemplo 1.234 se ve como 1.230.)
          </li>
        </ol>
      </details>

      <details className="mk-metricas-guide">
        <summary>
          LinkedIn <Status ok />
        </summary>
        <p>
          LinkedIn no deja leer las estadísticas de perfiles personales con su API, así que se cargan con el archivo que exportás vos (no hace falta
          ninguna variable):
        </p>
        <ol>
          <li>En LinkedIn abrí tu perfil → <strong>Analytics</strong> → <strong>Impresiones de publicaciones</strong>.</li>
          <li>Elegí <strong>últimos 365 días</strong> y tocá <strong>Exportar</strong>. Se baja un archivo .xlsx.</li>
          <li>Subilo con el botón de la tarjeta de LinkedIn. Trae seguidores por día y tus publicaciones con impresiones e interacciones.</li>
          <li>Lo ideal es subirlo una vez por semana. Si subís un archivo que se pisa con otro, se actualiza sin duplicar.</li>
        </ol>
      </details>

      <details className="mk-metricas-guide">
        <summary>Avisos, lectura diaria y resumen semanal</summary>
        <ul>
          <li>La lectura automática corre todos los días a las 6 de la mañana (hora de Argentina) y el resumen semanal los lunes a las 9.</li>
          <li>
            El resumen llega por mail a <code>ADMIN_NOTIFY_EMAIL</code> (usa <code>RESEND_API_KEY</code>, <Status ok={env.resend} />) y queda en la
            campana del hub.
          </li>
          <li>Si una lectura falla o un token está por vencer, te llega un aviso una sola vez (y otro cada 7 días si sigue sin resolverse).</li>
          <li>
            Para que cada publicación se cruce con su pieza del calendario (y aparezca su pilar), pegá el link de la publicación en la pieza. El cruce
            se hace solo.
          </li>
        </ul>
      </details>
    </section>
  );
}
