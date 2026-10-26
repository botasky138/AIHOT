import assert from "node:assert/strict";
import test from "node:test";
import { pickFeaturedCodexEvent } from "../web/codex-featured.ts";

function ev(partial) {
  return {
    id: partial.id,
    type: "direct_reset",
    label: "reset",
    displayLabel: "重置",
    presentation: { status: partial.pres ?? partial.status, scopeKnown: false, scopeLabel: null, kindExplicit: false, timeInferred: false, audienceZh: null, productsZh: null },
    status: partial.status,
    title: partial.title ?? partial.id,
    createdAt: partial.createdAt,
    updatedAt: partial.createdAt,
    confirmedAt: partial.confirmedAt ?? null,
    occurredOn: null,
    confirmationBasis: null,
    schedule: null,
    estimate: partial.estimate ?? null,
    posts: [],
    url: "https://example.com",
  };
}

test("featured prefers newest confirmed over stale likely_completed Oct-23 window", () => {
  const events = [
    ev({ id: "c25", status: "confirmed", pres: "confirmed", createdAt: "2026-10-25T11:40:04.000+08:00", confirmedAt: "2026-10-25T14:06:16.000+08:00", title: "Tibo 确认重置" }),
    ev({ id: "a22", status: "announced", pres: "likely_completed", createdAt: "2026-10-22T14:55:22.000+08:00", estimate: { from: "x", through: "y", basis: "source", label: "北京时间 10月22日–10月23日", reason: "old" }, title: "额度应已重置" }),
    ev({ id: "a23", status: "announced", pres: "likely_completed", createdAt: "2026-10-23T12:47:34.000+08:00", estimate: { from: "x", through: "y", basis: "model", label: "北京时间 10月23日–10月24日", reason: "old" }, title: "额度应已重置" }),
  ];
  const featured = pickFeaturedCodexEvent(events);
  assert.equal(featured?.id, "c25");
});

test("featured prefers active announced over older confirmed", () => {
  const events = [
    ev({ id: "c20", status: "confirmed", createdAt: "2026-10-20T14:33:48.000+08:00", confirmedAt: "2026-10-20T14:33:48.000+08:00" }),
    ev({ id: "a26", status: "announced", pres: "announced", createdAt: "2026-10-26T09:00:00.000+08:00" }),
  ];
  assert.equal(pickFeaturedCodexEvent(events)?.id, "a26");
});
