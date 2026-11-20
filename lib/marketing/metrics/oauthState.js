// Cookie de "state" para el OAuth de Meta (protege contra CSRF en el callback).
import { randomBytes, timingSafeEqual } from "crypto";

export const STATE_COOKIE = "mk_metrics_oauth";
const PATH = "/api/admin/marketing/metrics/oauth";

export function newState() {
  return randomBytes(24).toString("hex");
}

export function stateCookie(network, state, secure) {
  return `${STATE_COOKIE}=${network}.${state}; Path=${PATH}; HttpOnly; SameSite=Lax; Max-Age=600${secure ? "; Secure" : ""}`;
}

export function clearStateCookie(secure) {
  return `${STATE_COOKIE}=; Path=${PATH}; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function checkState(cookieValue, network, state) {
  if (!cookieValue || !state) return false;
  const expected = Buffer.from(`${network}.${state}`);
  const got = Buffer.from(cookieValue);
  return expected.length === got.length && timingSafeEqual(expected, got);
}
