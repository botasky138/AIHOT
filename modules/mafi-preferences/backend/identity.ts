import { randomUUID } from "node:crypto";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE_SEC } from "../contracts.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDeviceId(value: string): boolean {
  return UUID_RE.test(value);
}

export function newDeviceId(): string {
  return randomUUID();
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* ignore malformed */
    }
  }
  return out;
}

export function readDeviceId(cookieHeader: string | undefined): string | null {
  const raw = parseCookies(cookieHeader)[DEVICE_COOKIE];
  return raw && isDeviceId(raw) ? raw : null;
}

export function deviceSetCookie(deviceId: string, secure: boolean): string {
  return `${DEVICE_COOKIE}=${encodeURIComponent(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DEVICE_COOKIE_MAX_AGE_SEC}${secure ? "; Secure" : ""}`;
}

/** Loopback hosts used interchangeably in local preview (SITE_URL vs browser bar). */
function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

function effectivePort(u: URL): string {
  if (u.port) return u.port;
  return u.protocol === "https:" ? "443" : "80";
}

/**
 * CSRF gate for reactions: exact Origin match, or localhost ↔ 127.0.0.1 / ::1
 * with the same scheme and port (common local-preview mismatch).
 */
export function sameSiteOrigin(originHeader: string, site: string): boolean {
  if (!originHeader || originHeader === "null") return false;
  if (originHeader === site) return true;
  try {
    const o = new URL(originHeader);
    const s = new URL(site);
    if (o.protocol !== s.protocol) return false;
    if (effectivePort(o) !== effectivePort(s)) return false;
    if (o.hostname === s.hostname) return true;
    return isLoopbackHost(o.hostname) && isLoopbackHost(s.hostname);
  } catch {
    return false;
  }
}
