import test from "node:test";
import assert from "node:assert/strict";
import { articleWeight, sourceWeight, prefFactor, finalSortKey, reorderFlat, reorderGrouped, type Rankable } from "../backend/weights.ts";

test("articleWeight binding numbers", () => {
  assert.equal(articleWeight("down"), 0.15);
  assert.equal(articleWeight("up"), 1.25);
  assert.equal(articleWeight(null), 1);
});

test("sourceWeight clamp and formula", () => {
  assert.equal(sourceWeight({ ups: 0, downs: 0 }), 1);
  assert.equal(sourceWeight({ ups: 0, downs: 9 }), 0.3);
  assert.equal(sourceWeight({ ups: 9, downs: 0 }), 1.8);
  assert.equal(sourceWeight({ ups: 2, downs: 1 }), 1 + 0.15 * 2 - 0.25 * 1);
});

test("prefFactor and finalSortKey", () => {
  assert.ok(Math.abs(prefFactor("down", { ups: 0, downs: 9 }) - 0.045) < 1e-12);
  assert.equal(finalSortKey(100, null, { ups: 0, downs: 0 }), 100);
  assert.ok(finalSortKey(100, "down", { ups: 0, downs: 0 }) < 100);
  assert.ok(finalSortKey(100, "up", { ups: 0, downs: 0 }) > 100);
});

test("reorderFlat demotes downvoted item inside window only", () => {
  const items: Rankable[] = [
    { id: "a", publicBaseScore: 100, publicTimeMs: 3, vote: null, sourceCounts: { ups: 0, downs: 0 } },
    { id: "b", publicBaseScore: 90, publicTimeMs: 2, vote: "down", sourceCounts: { ups: 0, downs: 0 } },
    { id: "c", publicBaseScore: 80, publicTimeMs: 1, vote: null, sourceCounts: { ups: 0, downs: 0 } },
  ];
  assert.deepEqual(reorderFlat(items).map((x) => x.id), ["a", "c", "b"]);
});

test("reorderGrouped: one downvote demotes that item only; group uses max member key", () => {
  const items: Rankable[] = [
    { id: "g1-weak", groupKey: "g1", publicBaseScore: 50, publicTimeMs: 5, vote: "down", sourceCounts: { ups: 0, downs: 0 } },
    { id: "g1-strong", groupKey: "g1", publicBaseScore: 100, publicTimeMs: 4, vote: null, sourceCounts: { ups: 0, downs: 0 } },
    { id: "g2", groupKey: "g2", publicBaseScore: 80, publicTimeMs: 3, vote: null, sourceCounts: { ups: 0, downs: 0 } },
  ];
  const ordered = reorderGrouped(items).map((x) => x.id);
  assert.equal(ordered[0], "g1-strong");
  assert.ok(ordered.includes("g1-weak"));
  assert.ok(ordered.indexOf("g1-strong") < ordered.indexOf("g1-weak"));
  assert.ok(ordered.indexOf("g1-strong") < ordered.indexOf("g2"));
});
