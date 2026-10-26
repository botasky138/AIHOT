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
