// YouTube Data API v3 con API key (solo datos públicos del canal).
// Costos de cuota: channels.list, playlistItems.list y videos.list = 1 unidad cada uno.
import { YT_API, RECENT_POSTS_DAYS } from "./config";
import { fetchJson, qs, toInt } from "./http";
import { DAY_MS } from "./dates";

const key = () => process.env.YOUTUBE_API_KEY;

/** Acepta un id de canal (UC...), un @handle o un link al canal. */
export async function resolveChannel(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Escribí el id o el @usuario del canal");
  let filter;
  const idMatch = raw.match(/(UC[A-Za-z0-9_-]{22})/);
  const handleMatch = raw.match(/@([A-Za-z0-9._-]+)/);
  if (idMatch) filter = { id: idMatch[1] };
  else if (handleMatch) filter = { forHandle: `@${handleMatch[1]}` };
  else filter = { forHandle: `@${raw.replace(/^@/, "")}` };

  const data = await fetchJson(`${YT_API}/channels?${qs({ part: "snippet,statistics,contentDetails", ...filter, key: key() })}`);
  const ch = data?.items?.[0];
  if (!ch) throw new Error("No encontré ese canal de YouTube");
  return ch;
}

function durationSeconds(iso) {
  const m = String(iso || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

export async function youtubeSync(channelId) {
  const ch = await resolveChannel(channelId);
  const stats = ch.statistics || {};
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads;

  let posts = [];
  if (uploads) {
    const pl = await fetchJson(
      `${YT_API}/playlistItems?${qs({ part: "contentDetails", playlistId: uploads, maxResults: 50, key: key() })}`
    );
    const since = Date.now() - RECENT_POSTS_DAYS * 2 * DAY_MS;
    const ids = (pl?.items || [])
      .filter((i) => !i.contentDetails?.videoPublishedAt || new Date(i.contentDetails.videoPublishedAt).getTime() >= since)
      .map((i) => i.contentDetails?.videoId)
      .filter(Boolean);
    if (ids.length) {
      const vids = await fetchJson(
        `${YT_API}/videos?${qs({ part: "snippet,statistics,contentDetails", id: ids.join(","), key: key() })}`
      );
      posts = (vids?.items || []).map((v) => {
        const secs = durationSeconds(v.contentDetails?.duration);
        return {
          external_id: v.id,
          permalink: `https://www.youtube.com/watch?v=${v.id}`,
          caption: v.snippet?.title || null,
          media_type: secs !== null && secs <= 180 ? "short" : "video",
          posted_at: v.snippet?.publishedAt || null,
          views: toInt(v.statistics?.viewCount),
          likes: toInt(v.statistics?.likeCount),
          comments: toInt(v.statistics?.commentCount),
          source: "api",
          extra: { duration_s: secs },
        };
      });
    }
  }

  return {
    channel: {
      id: ch.id,
      title: ch.snippet?.title,
      handle: ch.snippet?.customUrl || null,
    },
    followers: stats.hiddenSubscriberCount ? null : toInt(stats.subscriberCount),
    extra: { views: toInt(stats.viewCount), videos: toInt(stats.videoCount) },
    posts,
  };
}
