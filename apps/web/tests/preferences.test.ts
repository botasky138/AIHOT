import test from "node:test";
import assert from "node:assert/strict";
import { nextVote } from "../../../modules/mafi-preferences/web/controller.ts";
import { allHrefAfterPreferenceChange, fetchTimelineHeadState } from "../app/features/feed/preference-refresh.ts";

test("nextVote toggles and switches", () => {
  assert.equal(nextVote(null, "up"), "up");
  assert.equal(nextVote("up", "up"), null);
  assert.equal(nextVote("up", "down"), "down");
  assert.equal(nextVote("down", "down"), null);
  assert.equal(nextVote(null, "down"), "down");
});

test("preferences-changed handler builds all href at page 1 keeping filters", () => {
  const href = allHrefAfterPreferenceChange("category=models&page=3&channel=news");
  assert.equal(href, "/all?category=models&channel=news");
  const sp = new URLSearchParams(href.slice("/all?".length));
  assert.equal(sp.get("page"), null);
  assert.equal(sp.get("category"), "models");
  assert.equal(sp.get("channel"), "news");
  assert.equal(allHrefAfterPreferenceChange("page=2"), "/all");
  assert.equal(allHrefAfterPreferenceChange("q=hello&tab=relevance&page=4"), "/all?q=hello&tab=relevance");
});

test("timeline head reset helper refetches without cursor and replaces state", async () => {
  const prior = { nextCursor: "abc", cards: [{ key: "old" }] };
  assert.ok(prior.nextCursor === "abc" && prior.cards.length > 0);

  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    assert.ok(!url.includes("cursor="), `head fetch must omit cursor: ${url}`);
    return new Response(
      JSON.stringify({
        filters: { channel: "all", category: null, tag: null },
        cards: [{ key: "fresh", anchorAt: "2026-10-26T00:00:00.000Z", item: { id: "i1" }, group: null }],
        nextCursor: "head-next",
        hot: null,
        dayCounts: { "2026-10-26": 1 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const next = await fetchTimelineHeadState("/api/site/timeline", { unreadOnly: true });
    assert.equal(next.nextCursor, "head-next");
    assert.equal(next.cards.length, 1);
    assert.equal(next.cards[0]!.key, "fresh");
    assert.equal(next.batches, 1);
    assert.deepEqual(next.collapsed, []);
    assert.equal(next.unreadOnly, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!, /\/api\/site\/timeline/);
  } finally {
    globalThis.fetch = original;
  }
});
