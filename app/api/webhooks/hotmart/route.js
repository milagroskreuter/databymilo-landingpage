import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Hotmart avisa acá cada cambio de estado de una compra (webhook versión 2.0.0).
// Se configura en Hotmart → Herramientas → Webhook con la URL
// https://www.databymilo.me/api/webhooks/hotmart y se activa con HOTMART_HOTTOK.
//
// Cada aviso se guarda crudo en hotmart_webhook_log y la compra queda en `sales`
// (una fila por transacción, que se actualiza si después hay reembolso, etc.).

const STATUS_BY_EVENT = {
  PURCHASE_BILLET_PRINTED: "waiting_payment",
  PURCHASE_APPROVED: "approved",
  PURCHASE_COMPLETE: "completed",
  PURCHASE_PROTEST: "refund_requested",
  PURCHASE_REFUNDED: "refunded",
  PURCHASE_CHARGEBACK: "chargeback",
  PURCHASE_CANCELED: "canceled",
  PURCHASE_EXPIRED: "expired",
  PURCHASE_DELAYED: "overdue",
};

// Estados que cuentan como venta cobrada (el dashboard usa los mismos).
const PAID_STATUSES = ["approved", "completed"];
const REVERSED = new Set(["refunded", "chargeback"]);

const BUYERS_LIST = "compradoras";

/** Comparación en tiempo constante. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Hotmart manda fechas como milisegundos (número o texto). */
function toIso(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  const d = Number.isFinite(n) ? new Date(n) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toNumber(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function normalize(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function money(amount, currency) {
  if (amount == null) return "";
  return `${currency || ""} ${amount.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`.trim();
}

/** Asocia el producto de Hotmart con un recurso del sitio (por código del link de pago o por nombre). */
async function findResourceSlug(supabase, product) {
  try {
    const { data } = await supabase.from("resources").select("slug, title, payment_url").eq("is_paid", true);
    const ucode = product?.ucode ? String(product.ucode) : null;
    const name = normalize(product?.name);
    for (const r of data ?? []) {
      if (ucode && r.payment_url && r.payment_url.includes(ucode)) return r.slug;
    }
    for (const r of data ?? []) {
      const title = normalize(r.title);
      if (name && title && (name.includes(title) || title.includes(name))) return r.slug;
    }
  } catch {}
  return null;
}

export async function POST(request) {
  const secret = process.env.HOTMART_HOTTOK;
  if (!secret) {
    return Response.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const hottok = request.headers.get("x-hotmart-hottok") || payload?.hottok;
  if (!safeEqual(hottok, secret)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const event = String(payload?.event || "");
  const data = payload?.data ?? {};
  const purchase = data.purchase ?? {};
  const transaction = purchase.transaction ? String(purchase.transaction) : null;

  // 1) Registro crudo (nunca bloquea el resto)
  const { error: logError } = await supabase
    .from("hotmart_webhook_log")
    .insert({ event, transaction, payload });
  if (logError) console.error("hotmart log error:", logError.message);

  const status = STATUS_BY_EVENT[event];
  // Eventos sin compra (carrito abandonado, suscripciones, etc.): solo quedan en el registro.
  if (!status || !transaction) return Response.json({ ok: true, stored: false });

  const product = data.product ?? {};
  const buyer = data.buyer ?? {};
  const email = buyer.email ? String(buyer.email).toLowerCase().trim() : null;
  const producerCommission = (data.commissions ?? []).find(
    (c) => String(c?.source || "").toUpperCase() === "PRODUCER"
  );
  const isTest =
    String(product.id ?? "") === "0" ||
    /test postback/i.test(product.name || "") ||
    /@example\.com$/i.test(email || "");

  try {
    const { data: existing } = await supabase
      .from("sales")
      .select("status")
      .eq("transaction", transaction)
      .maybeSingle();
    const prev = existing?.status ?? null;

    // Si llega "aprobada" después de "completada" (avisos fuera de orden), no se retrocede.
    const nextStatus = prev === "completed" && status === "approved" ? prev : status;

    const row = {
      transaction,
      status: nextStatus,
      last_event: event,
      product_id: product.id != null ? String(product.id) : null,
      product_name: product.name || null,
      buyer_email: email,
      buyer_name: buyer.name || null,
      price: toNumber(purchase.price?.value ?? purchase.full_price?.value),
      currency: purchase.price?.currency_value || purchase.full_price?.currency_value || null,
      net_amount: toNumber(producerCommission?.value),
      net_currency: producerCommission?.currency_value || null,
      payment_type: purchase.payment?.type || null,
      is_test: isTest,
      purchased_at: toIso(purchase.order_date),
      approved_at: toIso(purchase.approved_date),
      updated_at: new Date().toISOString(),
    };
    if (!existing) row.resource_slug = await findResourceSlug(supabase, product);
    // No pisar datos que ya teníamos con vacíos de un aviso posterior
    for (const k of Object.keys(row)) if (row[k] == null && existing) delete row[k];

    const { error } = await supabase.from("sales").upsert(row, { onConflict: "transaction" });
    if (error) throw new Error(error.message);

    const wasPaid = PAID_STATUSES.includes(prev);
    const isPaid = PAID_STATUSES.includes(nextStatus);
    const amount = money(row.price ?? null, row.currency);

    // 2) Venta nueva
    if (isPaid && !wasPaid) {
      if (email && !isTest) {
        const { error: listError } = await supabase.from("list_subscribers").upsert(
          { list_slug: BUYERS_LIST, email, first_name: buyer.first_name || buyer.name || null, subscribed: true },
          { onConflict: "list_slug,email", ignoreDuplicates: true }
        );
        if (listError) console.error("hotmart buyers list error:", listError.message);
      }
      await notifyAdmin({
        type: "sale",
        title: isTest
          ? "Prueba de Hotmart recibida ✓"
          : `Venta: ${product.name || "producto"}${amount ? ` · ${amount}` : ""}`,
        body: isTest
          ? "El webhook de Hotmart está conectado. Esta venta de prueba no cuenta en tus ingresos."
          : `${buyer.name || email || "Alguien"} compró ${product.name || "un producto"}.`,
        metadata: { transaction, email, product: product.name || null, test: isTest },
      });
    }

    // 3) Reembolso o contracargo de una venta que estaba cobrada
    if (REVERSED.has(nextStatus) && prev !== nextStatus) {
      await notifyAdmin({
        type: "refund",
        title: `${nextStatus === "chargeback" ? "Contracargo" : "Reembolso"}: ${product.name || "producto"}${amount ? ` · ${amount}` : ""}`,
        body: `${buyer.name || email || "Una compradora"} ${nextStatus === "chargeback" ? "desconoció el pago" : "pidió la devolución"}.`,
        metadata: { transaction, email, product: product.name || null, test: isTest },
      });
    }
  } catch (err) {
    console.error("hotmart webhook error:", err);
    // 500 para que Hotmart reintente
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return Response.json({ ok: true, stored: true });
}
