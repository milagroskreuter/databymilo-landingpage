// Lectura automática de cada red (la usa el cron diario y el botón "Actualizar ahora").
import { envStatus, REFRESH_WHEN_DAYS_LEFT, WARN_WHEN_DAYS_LEFT } from "./config";
import { getAccount, saveAccount, patchAccountMeta, upsertSnapshot, upsertPostMetrics, matchContent } from "./store";
import {
  refreshToken, instagramProfile, instagramPosts, instagramUnifiedProfile, instagramUnifiedPosts, threadsProfile, threadsPosts,
} from "./meta";
import { youtubeSync } from "./youtube";
import { openIssue, resolveIssue } from "./alerts";
import { daysUntil, DAY_MS } from "./dates";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" });

/** Renueva el token de Instagram/Threads si le quedan pocos días. Devuelve la cuenta al día. */
async function ensureFreshToken(supabase, network, account) {
  const left = daysUntil(account.token_expires_at);
  if (left !== null && left <= 0) {
    await openIssue(supabase, {
      network,
      kind: "token",
      message: "La conexión venció. Tocá \"Reconectar\" en la tarjeta de la red para volver a autorizarla.",
    });
    throw new Error("El token venció: hay que reconectar la cuenta");
  }
  if (left === null || left > REFRESH_WHEN_DAYS_LEFT) {
    await resolveIssue(supabase, network, "token");
    return account;
  }

  const issued = account.meta?.token_issued_at || account.connected_at;
  const age = issued ? Date.now() - new Date(issued).getTime() : Infinity;
  if (age < DAY_MS) return account; // Meta exige que tenga al menos 24 h

  try {
    const t = await refreshToken(network, account.access_token);
    const saved = await saveAccount(
      supabase,
      network,
      { access_token: t.access_token, token_expires_at: t.expires_at },
      { token_issued_at: new Date().toISOString(), token_refresh_error: null }
    );
    await resolveIssue(supabase, network, "token");
    return saved;
  } catch (err) {
    await patchAccountMeta(supabase, network, { token_refresh_error: err.message });
    if (left <= WARN_WHEN_DAYS_LEFT) {
      await openIssue(supabase, {
        network,
        kind: "token",
        message: `La conexión vence el ${fmtDate(account.token_expires_at)} y no se pudo renovar sola (${err.message}). Reconectala desde la tarjeta de la red.`,
      });
    }
    return account;
  }
}

async function syncMeta(supabase, network) {
  let account = await getAccount(supabase, network);
  if (!account?.access_token) return { network, skipped: "no conectada" };
  const unified = network === "instagram" && account.meta?.login === "unified";
  // El token unificado no se renueva solo: si vence, se pega uno nuevo desde el panel.
  if (!unified) account = await ensureFreshToken(supabase, network, account);
  const token = account.access_token;

  const profile = unified
    ? await instagramUnifiedProfile(token)
    : network === "instagram"
      ? await instagramProfile(token)
      : await threadsProfile(token);
  await upsertSnapshot(supabase, {
    network,
    followers: profile.followers_count ?? null,
    extra: network === "instagram" ? { media_count: profile.media_count ?? null } : {},
  });
  const posts = unified
    ? await instagramUnifiedPosts(token, profile.id)
    : network === "instagram"
      ? await instagramPosts(token)
      : await threadsPosts(token);
  const saved = await upsertPostMetrics(supabase, network, posts);

  await saveAccount(
    supabase,
    network,
    { handle: profile.username || account.handle, external_id: String(profile.id || account.external_id || "") || null },
    { last_sync_at: new Date().toISOString(), last_error: null, followers_error: profile.followers_error || null }
  );
  return { network, followers: profile.followers_count ?? null, posts: saved };
}

async function syncYoutube(supabase) {
  if (!envStatus().youtube) return { network: "youtube", skipped: "falta YOUTUBE_API_KEY" };
  const account = await getAccount(supabase, "youtube");
  const channelId = account?.external_id || process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return { network: "youtube", skipped: "falta el canal" };

  const r = await youtubeSync(channelId);
  await upsertSnapshot(supabase, { network: "youtube", followers: r.followers, extra: r.extra });
  const saved = await upsertPostMetrics(supabase, "youtube", r.posts);
  await saveAccount(
    supabase,
    "youtube",
    {
      handle: r.channel.handle || r.channel.title,
      external_id: r.channel.id,
      connected_at: account?.connected_at || new Date().toISOString(),
    },
    { title: r.channel.title, last_sync_at: new Date().toISOString(), last_error: null }
  );
  return { network: "youtube", followers: r.followers, posts: saved };
}

const SYNCERS = {
  instagram: (s) => syncMeta(s, "instagram"),
  threads: (s) => syncMeta(s, "threads"),
  youtube: (s) => syncYoutube(s),
};

/** Lee una red o todas. Nunca lanza: cada red devuelve { ok } o { error }. */
export async function runSync(supabase, { networks = Object.keys(SYNCERS), notify = true } = {}) {
  const results = [];
  for (const network of networks) {
    if (!SYNCERS[network]) continue;
    try {
      const r = await SYNCERS[network](supabase);
      results.push({ ok: true, ...r });
      if (!r.skipped) await resolveIssue(supabase, network, "sync");
    } catch (err) {
      console.error(`metrics sync ${network}:`, err.message);
      results.push({ ok: false, network, error: err.message });
      try {
        await patchAccountMeta(supabase, network, { last_error: err.message, last_error_at: new Date().toISOString() });
      } catch {
        /* la cuenta puede no existir */
      }
      if (notify) {
        await openIssue(supabase, { network, kind: "sync", message: `La lectura automática falló: ${err.message}` });
      }
    }
  }
  let matched = 0;
  try {
    matched = await matchContent(supabase);
  } catch (err) {
    console.error("metrics matchContent:", err.message);
  }
  return { results, matched };
}
