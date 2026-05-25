"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "¿Es para principiantes en data o para gente con experiencia?",
    a: "Funciona para ambas. Si recién empezás, te da un sistema que vas a usar desde tu primera presentación. Si ya llevás un par de años, te ordena cosas que probablemente intuís pero no aplicás de forma consistente. No funciona para data scientists muy senior que presentan solo a otros DS.",
  },
  {
    q: "¿Necesito saber Power BI, Tableau o algún software específico?",
    a: "No. La guía es sobre comunicación, no sobre herramientas. Los principios aplican igual si usás Excel, Looker, Tableau, Power BI, Sheets o Python con matplotlib.",
  },
  {
    q: "¿En qué formato lo recibo?",
    a: "PDF descargable. Lo abrís en cualquier dispositivo (compu, tablet, celular).",
  },
  {
    q: "¿Puedo imprimirlo?",
    a: "Sí. Las páginas pensadas para imprimir (workbook, checklist, cheat sheet) están diseñadas para que se vean bien en A4.",
  },
  {
    q: "¿Cómo me llega después de pagar?",
    a: "Apenas confirmás el pago, te llega un mail con el link de descarga. Acceso inmediato, sin esperas.",
  },
  {
    q: "¿Y si no me sirve?",
    a: "Tenés 7 días desde la compra para pedir devolución sin justificar nada. Me mandás un mensaje y te devolvemos el 100% del monto. Sin preguntas.",
  },
  {
    q: "¿Puedo compartirlo con una compañera?",
    a: "La compra es individual. Si querés que alguien más tenga el PDF, lo ideal es que compre su propia copia. Si lo querés comprar para tu equipo (3 personas o más), escribime a Instagram y armamos un descuento.",
  },
  {
    q: "¿Hay versión en otros idiomas?",
    a: "Por ahora solo en español. Si tenés mucho interés en una versión en inglés o portugués, mandame un mensaje y te aviso si la armamos.",
  },
  {
    q: "¿Quién está atrás de esto?",
    a: "Yo, Milo. Trabajo como Data Analyst y BI Developer en una corpo tech de LATAM. Si tenés cualquier consulta antes o después de comprar, escribime a Instagram (@databymilo) y te respondo.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {FAQS.map((faq, i) => (
        <div
          key={i}
          style={{ borderBottom: "1px solid rgba(139,26,74,.12)" }}
        >
          <button
            className="faq-q-btn"
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%",
              padding: "20px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--ink)",
              textAlign: "left",
            }}
          >
            <span>{faq.q}</span>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              color: "var(--vino)",
              transition: "transform 220ms ease",
              transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
              flexShrink: 0,
              lineHeight: 1,
            }}>
              +
            </span>
          </button>
          <div className="faq-a-wrap" style={{
            maxHeight: open === i ? 400 : 0,
            overflow: "hidden",
            transition: "max-height 280ms ease",
          }}>
            <p style={{
              padding: "0 24px 20px 0",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1.75,
              color: "var(--fg-2)",
              margin: 0,
            }}>
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
