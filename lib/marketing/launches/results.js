// Ventas de un lanzamiento (tabla sales) contra el período anterior de igual largo.
import { addDays, diffDays, isoToDateAR, startOfDayIso, todayAR } from "./dates";
import { effectiveDates } from "./schedule";

const PAID_STATUSES = ["approved", "completed"];

const amountOf = (s) =>
  s.net_amount != null
    ? { value: Number(s.net_amount), currency: s.net_currency || s.currency || "" }
    : { value: Number(s.price || 0), currency: s.currency || "" };

function totals(list) {
  const byCur = {};
  for (const s of list) {
    const a = amountOf(s);
    byCur[a.currency] = (byCur[a.currency] || 0) + a.value;
  }
  return Object.entries(byCur)
    .map(([currency, value]) => ({ currency, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => (b.currency === "USD") - (a.currency === "USD") || b.value - a.value);
}

export async function launchResults(supabase, launch) {
  const { launchOn, endsOn } = effectiveDates(launch);
  if (!launch.resource_slug) return { available: false, reason: "no_resource" };
  if (!launchOn) return { available: false, reason: "no_dates" };

  const today = todayAR();
  if (launchOn > today) return { available: false, reason: "not_started", launchOn };

  // Período del lanzamiento: de la apertura al cierre (o hasta hoy si sigue abierto).
  const to = endsOn < today ? endsOn : today;
  const days = diffDays(launchOn, to) + 1;
  const prevFrom = addDays(launchOn, -days);
  const prevTo = addDays(launchOn, -1);

  const { data, error } = await supabase
    .from("sales")
    .select("transaction, status, price, currency, net_amount, net_currency, approved_at")
    .eq("resource_slug", launch.resource_slug)
    .eq("is_test", false)
    .in("status", PAID_STATUSES)
    .gte("approved_at", startOfDayIso(prevFrom))
    .lt("approved_at", startOfDayIso(addDays(to, 1)))
    .order("approved_at", { ascending: true });
  if (error) return { available: false, reason: "error", error: error.message };

  const rows = (data || []).map((s) => ({ ...s, day: isoToDateAR(s.approved_at) }));
  const current = rows.filter((s) => s.day >= launchOn && s.day <= to);
  const previous = rows.filter((s) => s.day >= prevFrom && s.day <= prevTo);

  // Ventas por día del lanzamiento.
  const daily = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(launchOn, i);
    daily.push({ day, count: current.filter((s) => s.day === day).length });
  }

  const pct = previous.length ? Math.round(((current.length - previous.length) / previous.length) * 100) : null;

  return {
    available: true,
    period: { from: launchOn, to, days, open: endsOn >= today },
    previousPeriod: { from: prevFrom, to: prevTo },
    current: { count: current.length, totals: totals(current) },
    previous: { count: previous.length, totals: totals(previous) },
    deltaPct: pct,
    daily,
    goal: launch.goal_sales ?? null,
    usesNet: current.some((s) => s.net_amount != null),
  };
}
