type Bucket = { windowStart: number; count: number; burstStart: number; burstCount: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const WINDOW_MAX = 60;
const BURST_MS = 1_000;
const BURST_MAX = 10;

function touch(key: string, now: number): { allowed: boolean; retryAfter: number } {
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= WINDOW_MS) b = { windowStart: now, count: 0, burstStart: now, burstCount: 0 };
  if (now - b.burstStart >= BURST_MS) { b.burstStart = now; b.burstCount = 0; }
  if (b.burstCount >= BURST_MAX) {
    buckets.set(key, b);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((b.burstStart + BURST_MS - now) / 1000)) };
  }
  if (b.count >= WINDOW_MAX) {
    buckets.set(key, b);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((b.windowStart + WINDOW_MS - now) / 1000)) };
  }
  b.count += 1;
  b.burstCount += 1;
  buckets.set(key, b);
  return { allowed: true, retryAfter: 0 };
}

export function checkReactionLimit(args: { deviceId: string | null; ip: string; now?: number }): { allowed: boolean; retryAfter: number } {
  const now = args.now ?? Date.now();
  const ipResult = touch(`ip:${args.ip}`, now);
  if (!ipResult.allowed) return ipResult;
  if (args.deviceId) {
    const deviceResult = touch(`device:${args.deviceId}`, now);
    if (!deviceResult.allowed) return deviceResult;
  }
  return { allowed: true, retryAfter: 0 };
}

export function _resetLimitsForTest(): void {
  buckets.clear();
}
