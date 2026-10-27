import test from "node:test";
import assert from "node:assert/strict";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE_SEC } from "../contracts.ts";
import { deviceSetCookie, isDeviceId, newDeviceId, readDeviceId, sameSiteOrigin } from "../backend/identity.ts";
import { checkReactionLimit, _resetLimitsForTest } from "../backend/limits.ts";

test("device cookie attributes", () => {
  const id = "33333333-3333-4333-8333-333333333333";
  const c = deviceSetCookie(id, true);
  assert.match(c, new RegExp(`^${DEVICE_COOKIE}=`));
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Lax/);
  assert.match(c, /Path=\//);
  assert.match(c, new RegExp(`Max-Age=${DEVICE_COOKIE_MAX_AGE_SEC}`));
  assert.match(c, /Secure/);
  assert.equal(deviceSetCookie(id, false).includes("Secure"), false);
  assert.equal(readDeviceId(`${DEVICE_COOKIE}=${encodeURIComponent(id)}`), id);
  assert.equal(readDeviceId(`${DEVICE_COOKIE}=not-a-uuid`), null);
  assert.ok(isDeviceId(newDeviceId()));
});

test("rate limit 60/min and burst 10", () => {
  _resetLimitsForTest();
  const ip = "203.0.113.9";
  const deviceId = "44444444-4444-4444-8444-444444444444";
  let now = 1_000_000;
  for (let i = 0; i < 10; i++) {
    assert.equal(checkReactionLimit({ deviceId, ip, now }).allowed, true);
    now += 1;
  }
  assert.equal(checkReactionLimit({ deviceId, ip, now }).allowed, false);
  now += 1000;
  // Space at 100ms so sustained rate stays within burst 10/1s while filling the 60/min window.
  // Brief used 10ms here, which re-trips burst after 10 of the 50 (conflicts with limits.ts).
  for (let i = 0; i < 50; i++) {
    assert.equal(checkReactionLimit({ deviceId, ip, now: now + i * 100 }).allowed, true);
  }
  const denied = checkReactionLimit({ deviceId, ip, now: now + 50 * 100 });
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfter >= 1);
});

test("loopback Origin aliases match SITE_URL for reactions CSRF", () => {
  const siteLocal = "http://localhost:3000";
  const siteLoop = "http://127.0.0.1:3000";
  assert.equal(sameSiteOrigin("http://127.0.0.1:3000", siteLocal), true);
  assert.equal(sameSiteOrigin("http://localhost:3000", siteLoop), true);
  assert.equal(sameSiteOrigin("http://localhost:3000", siteLocal), true);
  assert.equal(sameSiteOrigin("http://127.0.0.1:3000", siteLoop), true);
  assert.equal(sameSiteOrigin("http://127.0.0.1:3001", siteLocal), false);
  assert.equal(sameSiteOrigin("https://127.0.0.1:3000", siteLocal), false);
  assert.equal(sameSiteOrigin("https://evil.example", siteLocal), false);
  assert.equal(sameSiteOrigin("null", siteLocal), false);
});
