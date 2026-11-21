// Configuración del área Métricas de redes.
// Versiones y endpoints verificados contra la documentación oficial (nov 2026):
// - Instagram API with Instagram Login: graph.instagram.com (Graph API v26.0, julio 2026).
// - Threads API: graph.threads.com/v1.0 (threads.net sigue funcionando como alias).
// - YouTube Data API v3: www.googleapis.com/youtube/v3.

import { SITE_URL } from "@/lib/notify";

export const IG_API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";
export const IG_GRAPH = `https://graph.instagram.com/${IG_API_VERSION}`;
// Instagram con "Unified login" (apps nuevas de Meta): se lee con graph.facebook.com y un token de sistema.
export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v27.0";
export const FB_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const THREADS_GRAPH = "https://graph.threads.com/v1.0";
export const YT_API = "https://www.googleapis.com/youtube/v3";

export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"];
export const THREADS_SCOPES = ["threads_basic", "threads_manage_insights"];

// Redes que maneja esta pantalla, en el orden en que se muestran.
export const METRIC_NETWORKS = ["instagram", "linkedin", "threads", "youtube"];
export const OAUTH_NETWORKS = ["instagram", "threads"];

// Se renueva el token cuando le quedan menos de estos días (los tokens duran 60).
export const REFRESH_WHEN_DAYS_LEFT = 15;
// Se avisa si el token vence en menos de estos días y no se pudo renovar.
export const WARN_WHEN_DAYS_LEFT = 7;
// Publicaciones recientes cuyas métricas se actualizan en cada lectura.
export const RECENT_POSTS_DAYS = 365;
export const MAX_POSTS_PER_SYNC = 120;

export function envStatus() {
  return {
    instagram: Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET),
    threads: Boolean(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET),
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    linkedin: true, // no necesita variables: se importa el archivo
    resend: Boolean(process.env.RESEND_API_KEY),
  };
}

/** Base pública para los redirect_uri de OAuth (tienen que coincidir con los cargados en Meta). */
export function oauthBase(request) {
  if (process.env.MARKETING_OAUTH_BASE_URL) return process.env.MARKETING_OAUTH_BASE_URL.replace(/\/$/, "");
  if (request) {
    const { origin, hostname } = new URL(request.url);
    if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  }
  return SITE_URL;
}

export function redirectUri(network, request) {
  return `${oauthBase(request)}/api/admin/marketing/metrics/oauth/${network}/callback`;
}
