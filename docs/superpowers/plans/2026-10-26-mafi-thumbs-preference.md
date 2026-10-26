# MAFi Thumbs Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add device-scoped 👍/👎 on 动态 cards and article pages so that device's 动态 / 精选 / 热点 reading view reorders by preference — without changing collect, global scores, selected seats, reports, or public cache payloads.

**Architecture:** New site module `modules/mafi-preferences/` (same pattern as `mafi-readers`) owns device cookie identity, reaction persistence, weight math, private reaction HTTP, and thumbs UI. Engine publication loaders stay public-only; when a valid `mafi_device` cookie is present, site routes load the same public window then apply a pure per-device reorder projection and attach `myVote` under `Cache-Control: private, no-store`. Collect (`scheduleDueSources` / `adaptIntervals`) is never called from preference code.

**Tech Stack:** Node.js ≥24.11, TypeScript, PostgreSQL, Fastify, React 19, React Router 8, npm workspaces, `node:test` (standalone + DB harness), existing `cookie()` / `parseCookies` helpers in `@aihot/backend/admin/auth`.

**Spec:** [Revised design](../specs/2026-10-26-mafi-thumbs-preference-design.md) (revision commits `71460f3` / `9fc4f0d`).

## Global Constraints

- **v1 = reading preference only.** Do not change `packages/backend/src/sources/collect.ts` `scheduleDueSources` (~483) or `adaptIntervals`. No collect interval / source collect weight tasks.
- **Public isolation:** personal reorder is device view only. Never mutate global scores, `selected` seats, reports, or public cache payloads. Responses with `myVote` and device SSR: `Cache-Control: private, no-store`. Forward `mafi_device` cookie on personalized requests. 精选 "seating" for this feature = **per-device presentation order** over the same public pool (not new global selected rows).
- **Executable sort:** `articleWeight`: down=0.15 / up=1.25 / none=1.0. `sourceWeight = clamp(1 + 0.15*ups - 0.25*downs, 0.3, 1.8)`. `prefFactor = articleWeight × sourceWeight`. `finalSortKey = publicBaseScore × prefFactor`. Candidate scope = already-fetched public set; `LISTING_FLOOR_BEIJING_DATE=2026-10-23` unchanged; votes never expand/shrink the collect or eligible set.
- **动态 (`/all` pool):** reorder within the fetched page window; after a successful vote the client resets to page 1 (same filters) and refetches. **精选 (`/` timeline):** reorder within the fetched cursor/limit window; after vote client resets `cursor` to null and refetches page-1 head. (Product naming note: UI label 动态 is `/all`+pool/page; UI label 精选 is `/`+timeline/cursor — both get preference; each keeps its own pagination reset.)
- **精选/热点:** downvote demotes **that item only** (not the whole event group); group order uses max member `finalSortKey`.
- **Approach B:** anonymous `mafi_device` cookie (UUID) stored server-side by `(deviceId, itemId)`; table reserves nullable `user_id` for future merge; before login only device is recognized.
- **UI:** thumbs on 动态 preview cards (`FeedItem`) + content pages; toggleable votes; black-gold mechanical/metal aesthetic (status OK green only; no residual greens on thumbs UI).
- **Security:** Cookie HttpOnly, Secure if HTTPS, SameSite=Lax, Path=/, 400d (Max-Age=34560000); same-origin checks; rate limit 60 POST/min (burst 10) per deviceId (fallback IP); vote-eligible ids = same space as `/api/site/items/:id`; acceptance for duplicate POST, revoke null, concurrent last-writer-wins.
- **Affect feeds:** 动态 + 精选 + 热点 (not collect). Surfaces: `/all`+`/api/site/pool`, `/`+`/api/site/timeline` (+ home hot strip), `/hot`+`/api/site/hot`, item detail.
- **Git:** local commits only; **no push**.

---

## File structure map

| Path | Responsibility | Create / Modify |
|------|----------------|-----------------|
| `modules/mafi-preferences/package.json` | Workspace package `@aihot/mafi-preferences` | Create |
| `modules/mafi-preferences/contracts.ts` | `Vote`, `SourceCounts`, `ReactionResult`, weight constants | Create |
| `modules/mafi-preferences/backend/weights.ts` | Pure `articleWeight` / `sourceWeight` / `prefFactor` / `finalSortKey` / window reorder | Create |
| `modules/mafi-preferences/backend/store.ts` | DB ensure-device + set/read reactions; no row delete on revoke | Create |
| `modules/mafi-preferences/backend/identity.ts` | `mafi_device` parse/ensure/Set-Cookie (reuses admin `cookie`/`parseCookies` style) | Create |
| `modules/mafi-preferences/backend/limits.ts` | In-memory per-device + per-IP rate limit | Create |
| `modules/mafi-preferences/backend/http.ts` | `POST /api/site/reactions` registration helpers | Create |
| `modules/mafi-preferences/backend/views.ts` | Apply preference to pool/timeline/hot/item windows | Create |
| `modules/mafi-preferences/migrations/0091_mafi_preference_devices.sql` | devices table (+ nullable user_id) | Create |
| `modules/mafi-preferences/migrations/0092_mafi_preference_reactions.sql` | reactions table `(device_id, article_id)` | Create |
| `modules/mafi-preferences/module.ts` | `defineModule` declaration | Create |
| `modules/mafi-preferences/server.ts` | `ServerModule` with `http` + optional reader-view hook | Create |
| `modules/mafi-preferences/web.tsx` | `defineWebModule` + thumbs action export | Create |
| `modules/mafi-preferences/web/actions.tsx` | Black-gold `ThumbsButtons` | Create |
| `modules/mafi-preferences/web/controller.ts` | Client `submitReaction` + view invalidation | Create |
| `modules/mafi-preferences/tests/weights.standalone.test.ts` | Pure math tests | Create |
| `modules/mafi-preferences/tests/preferences.test.ts` | Store + HTTP + reorder DB tests | Create |
| `site/package.json` | Depend on `@aihot/mafi-preferences` | Modify |
| `site/modules/index.ts` | Register module declaration | Modify |
| `site/modules/server.ts` | Register server module | Modify |
| `site/modules/web.ts` | Register web module | Modify |
| `Dockerfile` | COPY module package.json (mirror mafi-readers) | Modify |
| `packages/contracts/src/site.ts` | Optional `myVote` on item summaries | Modify |
| `packages/backend/src/modules.ts` | Optional `readerView` on `ServerModule` | Modify |
| `apps/api/src/routes/site.ts` (personalize branch) | Resolve installed `mafi-preferences` server helpers by module name | Modify |
| `packages/backend/src/publication/pool.ts` | Internal `loadPoolReaderWindow` evidence (ids/sourceId/baseScore) — public `loadPool` signature unchanged | Modify |
| `packages/backend/src/publication/timeline.ts` | Internal `loadTimelineReaderWindow` evidence | Modify |
| `packages/backend/src/publication/hot.ts` / `stories.ts` | Internal hot-window evidence for preference | Modify |
| `apps/api/src/routes/site.ts` | Personalized branch: private no-store + myVote reorder when cookie present | Modify |
| `apps/web/app/modules.ts` | Optional `itemActions` on `WebModule` | Modify |
| `apps/web/app/features/item/ModuleItemActions.tsx` | Render registered item actions | Create |
| `apps/web/app/features/feed/FeedItem.tsx` | Mount thumbs next to `StarButton` | Modify |
| `apps/web/app/features/feed/Timeline.tsx` | On preference-invalidate: reset cursor, refetch head | Modify |
| `apps/web/app/routes/all.tsx` | After vote: navigate page=1 | Modify |
| `apps/web/app/routes/item.tsx` | Mount thumbs next to star / toolbar | Modify |
| `apps/web/app/features/item/ReaderTools.tsx` | Phone toolbar thumbs slot | Modify |
| `apps/web/app/lib/api.server.ts` | Forward Cookie on personalized loaders; honor private upstream | Modify |
| `apps/web/tests/preferences.test.ts` | SSR/cookie/UI acceptance | Create |

**Do not touch:** `packages/backend/src/sources/collect.ts`, publication score writers, selected/seat mutators, reports writers, public ETag paths when cookie absent.

---

### Task 1: Pure preference weight helpers

**Files:**
- Create: `modules/mafi-preferences/package.json`
- Create: `modules/mafi-preferences/contracts.ts`
- Create: `modules/mafi-preferences/backend/weights.ts`
- Create: `modules/mafi-preferences/tests/weights.standalone.test.ts`
- Modify: `site/package.json` (add `"@aihot/mafi-preferences": "*"`)
- Modify: `Dockerfile` (add `COPY modules/mafi-preferences/package.json modules/mafi-preferences/` next to mafi-readers)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export type Vote = "up" | "down" | null`
  - `export interface SourceCounts { ups: number; downs: number }`
  - `export function articleWeight(vote: Vote): number`
  - `export function sourceWeight(counts: SourceCounts): number`
  - `export function prefFactor(vote: Vote, counts: SourceCounts): number`
  - `export function finalSortKey(publicBaseScore: number, vote: Vote, counts: SourceCounts): number`
  - `export interface Rankable { id: string; publicBaseScore: number; publicTimeMs: number; vote: Vote; sourceCounts: SourceCounts; groupKey?: string }`
  - `export function compareRankable(a: Rankable, b: Rankable): number` — higher finalSortKey, then newer publicTimeMs, then id ascending
  - `export function reorderFlat<T extends Rankable>(items: readonly T[]): T[]`
  - `export function reorderGrouped<T extends Rankable>(items: readonly T[]): T[]` — groups by `groupKey ?? id`; group score = max member finalSortKey; members keep relative order by their own keys; one downvoted member does not collapse siblings

- [ ] **Step 1: Write the failing test**

```ts
// modules/mafi-preferences/tests/weights.standalone.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./tests/standalone.ts --test modules/mafi-preferences/tests/weights.standalone.test.ts`

Expected: FAIL (module / exports missing)

- [ ] **Step 3: Write minimal implementation**

```json
// modules/mafi-preferences/package.json
{
  "name": "@aihot/mafi-preferences",
  "private": true,
  "type": "module",
  "exports": {
    "./contracts": "./contracts.ts",
    "./module": "./module.ts",
    "./server": "./server.ts",
    "./web": "./web.tsx",
    "./weights": "./backend/weights.ts"
  },
  "dependencies": {
    "@aihot/backend": "*",
    "@aihot/contracts": "*",
    "@aihot/web": "*",
    "react": "19.3.0",
    "react-router": "8.4.0"
  }
}
```

```ts
// modules/mafi-preferences/contracts.ts
export type Vote = "up" | "down" | null;
export interface SourceCounts { ups: number; downs: number }
export interface ReactionResult {
  itemId: string;
  myVote: Vote;
  source: SourceCounts & { weight: number };
}
export const DEVICE_COOKIE = "mafi_device";
export const DEVICE_COOKIE_MAX_AGE_SEC = 400 * 24 * 60 * 60; // 34560000
export const ITEM_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;
```

```ts
// modules/mafi-preferences/backend/weights.ts
import type { SourceCounts, Vote } from "../contracts.ts";

export type { SourceCounts, Vote };

export function articleWeight(vote: Vote): number {
  if (vote === "down") return 0.15;
  if (vote === "up") return 1.25;
  return 1;
}

export function sourceWeight(counts: SourceCounts): number {
  const raw = 1 + 0.15 * counts.ups - 0.25 * counts.downs;
  return Math.min(1.8, Math.max(0.3, raw));
}

export function prefFactor(vote: Vote, counts: SourceCounts): number {
  return articleWeight(vote) * sourceWeight(counts);
}

export function finalSortKey(publicBaseScore: number, vote: Vote, counts: SourceCounts): number {
  return publicBaseScore * prefFactor(vote, counts);
}

export interface Rankable {
  id: string;
  publicBaseScore: number;
  publicTimeMs: number;
  vote: Vote;
  sourceCounts: SourceCounts;
  groupKey?: string;
}

export function compareRankable(a: Rankable, b: Rankable): number {
  const ka = finalSortKey(a.publicBaseScore, a.vote, a.sourceCounts);
  const kb = finalSortKey(b.publicBaseScore, b.vote, b.sourceCounts);
  if (ka !== kb) return kb - ka;
  if (a.publicTimeMs !== b.publicTimeMs) return b.publicTimeMs - a.publicTimeMs;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function reorderFlat<T extends Rankable>(items: readonly T[]): T[] {
  return [...items].sort(compareRankable);
}

export function reorderGrouped<T extends Rankable>(items: readonly T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.groupKey ?? item.id;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  const ranked = [...groups.entries()].map(([key, members]) => {
    const sortedMembers = [...members].sort(compareRankable);
    const groupScore = Math.max(...members.map((m) => finalSortKey(m.publicBaseScore, m.vote, m.sourceCounts)));
    const groupTime = Math.max(...members.map((m) => m.publicTimeMs));
    const groupId = sortedMembers[0]!.id;
    return { key, sortedMembers, groupScore, groupTime, groupId };
  });
  ranked.sort((a, b) => {
    if (a.groupScore !== b.groupScore) return b.groupScore - a.groupScore;
    if (a.groupTime !== b.groupTime) return b.groupTime - a.groupTime;
    return a.groupId < b.groupId ? -1 : a.groupId > b.groupId ? 1 : 0;
  });
  return ranked.flatMap((g) => g.sortedMembers);
}
```

Also add the dependency line in `site/package.json` and the Dockerfile COPY line (mirror `mafi-readers`). Run `npm install` at repo root so the workspace links (lockfile update is expected; do not bump unrelated versions).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import ./tests/standalone.ts --test modules/mafi-preferences/tests/weights.standalone.test.ts`

Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences/package.json modules/mafi-preferences/contracts.ts modules/mafi-preferences/backend/weights.ts modules/mafi-preferences/tests/weights.standalone.test.ts site/package.json package-lock.json Dockerfile
git commit -m "$(cat <<'EOF'
feat(mafi): add preference weight helpers

EOF
)"
```

No push.

---

### Task 2: Device + reaction persistence (DB)

**Files:**
- Create: `modules/mafi-preferences/migrations/0091_mafi_preference_devices.sql`
- Create: `modules/mafi-preferences/migrations/0092_mafi_preference_reactions.sql`
- Create: `modules/mafi-preferences/backend/store.ts`
- Create: `modules/mafi-preferences/tests/preferences.test.ts` (store section first)
- Modify: (none in engine schema — module migrations are picked up by `scripts/migrate.ts`)

**Interfaces:**
- Consumes: `Vote`, `SourceCounts`, `ReactionResult`, `sourceWeight` from Task 1
- Produces:
  - `ensureDeviceRow(deviceId: string, db?: Db): Promise<void>`
  - `setReaction(deviceId: string, itemId: string, vote: Vote, sourceId: string, db?: Db): Promise<ReactionResult>`
  - `readVotes(deviceId: string, itemIds: readonly string[], db?: Db): Promise<Map<string, Vote>>`
  - `readSourceCounts(deviceId: string, sourceIds: readonly string[], db?: Db): Promise<Map<string, SourceCounts>>`
  - Clear vote writes `vote = null` (row retained). Duplicate same vote is idempotent. Concurrent writers: last committed wins (single-row UPSERT).

- [ ] **Step 1: Write the failing test**

```ts
// modules/mafi-preferences/tests/preferences.test.ts  (first tests)
import test from "node:test";
import assert from "node:assert/strict";
import { sql } from "@aihot/backend/db";
import { ensureDeviceRow, setReaction, readVotes, readSourceCounts } from "../backend/store.ts";

const DEVICE_A = "11111111-1111-4111-8111-111111111111";
const DEVICE_B = "22222222-2222-4222-8222-222222222222";

test("setReaction upserts; null clears without delete; devices isolated", async () => {
  await ensureDeviceRow(DEVICE_A);
  await ensureDeviceRow(DEVICE_B);
  // Use a real public article_id + source_id from the test DB (fixture helpers in this file).
  const { itemId, sourceId } = await pickPublicItem();

  const up = await setReaction(DEVICE_A, itemId, "up", sourceId);
  assert.equal(up.myVote, "up");
  assert.equal(up.source.ups, 1);
  assert.equal(up.source.downs, 0);

  const again = await setReaction(DEVICE_A, itemId, "up", sourceId);
  assert.equal(again.myVote, "up");
  assert.equal(again.source.ups, 1);

  const down = await setReaction(DEVICE_A, itemId, "down", sourceId);
  assert.equal(down.myVote, "down");
  assert.equal(down.source.ups, 0);
  assert.equal(down.source.downs, 1);

  const cleared = await setReaction(DEVICE_A, itemId, null, sourceId);
  assert.equal(cleared.myVote, null);
  assert.equal(cleared.source.ups, 0);
  assert.equal(cleared.source.downs, 0);

  const [row] = await sql<{ vote: string | null }[]>`
    SELECT vote FROM mafi_preference_reactions WHERE device_id = ${DEVICE_A} AND article_id = ${itemId}`;
  assert.ok(row);
  assert.equal(row.vote, null);

  await setReaction(DEVICE_A, itemId, "up", sourceId);
  const bVotes = await readVotes(DEVICE_B, [itemId]);
  assert.equal(bVotes.get(itemId) ?? null, null);
  const bCounts = await readSourceCounts(DEVICE_B, [sourceId]);
  assert.deepEqual(bCounts.get(sourceId) ?? { ups: 0, downs: 0 }, { ups: 0, downs: 0 });
});

async function pickPublicItem(): Promise<{ itemId: string; sourceId: string }> {
  const [row] = await sql<{ id: string; source_id: string }[]>`
    SELECT p.article_id AS id, p.source_id
    FROM publications p
    WHERE p.visibility = 'public'
    ORDER BY p.sort_at DESC
    LIMIT 1`;
  assert.ok(row, "test DB needs at least one public publication");
  return { itemId: row.id, sourceId: row.source_id };
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test-global-setup=tests/databases.ts --import ./tests/databases.ts --test modules/mafi-preferences/tests/preferences.test.ts
```

Expected: FAIL (missing migrations / store)

- [ ] **Step 3: Write minimal implementation**

```sql
-- modules/mafi-preferences/migrations/0091_mafi_preference_devices.sql
CREATE TABLE mafi_preference_devices (
  device_id text PRIMARY KEY,
  user_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

```sql
-- modules/mafi-preferences/migrations/0092_mafi_preference_reactions.sql
CREATE TABLE mafi_preference_reactions (
  device_id text NOT NULL REFERENCES mafi_preference_devices (device_id) ON DELETE CASCADE,
  article_id text NOT NULL,
  source_id text NOT NULL,
  vote text NULL CHECK (vote IS NULL OR vote IN ('up', 'down')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, article_id)
);
CREATE INDEX mafi_preference_reactions_device_source_vote_idx
  ON mafi_preference_reactions (device_id, source_id)
  WHERE vote IS NOT NULL;
```

```ts
// modules/mafi-preferences/backend/store.ts
import { sql, type Db } from "@aihot/backend/db";
import type { ReactionResult, SourceCounts, Vote } from "../contracts.ts";
import { sourceWeight } from "./weights.ts";

export async function ensureDeviceRow(deviceId: string, db: Db = sql): Promise<void> {
  await db`
    INSERT INTO mafi_preference_devices (device_id) VALUES (${deviceId})
    ON CONFLICT (device_id) DO UPDATE SET updated_at = now()`;
}

async function countsFor(deviceId: string, sourceId: string, db: Db): Promise<SourceCounts> {
  const [row] = await db<SourceCounts[]>`
    SELECT
      count(*) FILTER (WHERE vote = 'up')::int AS ups,
      count(*) FILTER (WHERE vote = 'down')::int AS downs
    FROM mafi_preference_reactions
    WHERE device_id = ${deviceId} AND source_id = ${sourceId} AND vote IS NOT NULL`;
  return { ups: row?.ups ?? 0, downs: row?.downs ?? 0 };
}

export async function setReaction(deviceId: string, itemId: string, vote: Vote, sourceId: string, db: Db = sql): Promise<ReactionResult> {
  await ensureDeviceRow(deviceId, db);
  await db`
    INSERT INTO mafi_preference_reactions (device_id, article_id, source_id, vote, updated_at)
    VALUES (${deviceId}, ${itemId}, ${sourceId}, ${vote}, now())
    ON CONFLICT (device_id, article_id) DO UPDATE SET
      source_id = EXCLUDED.source_id,
      vote = EXCLUDED.vote,
      updated_at = now()`;
  const source = await countsFor(deviceId, sourceId, db);
  return { itemId, myVote: vote, source: { ...source, weight: sourceWeight(source) } };
}

export async function readVotes(deviceId: string, itemIds: readonly string[], db: Db = sql): Promise<Map<string, Vote>> {
  const out = new Map<string, Vote>();
  if (itemIds.length === 0) return out;
  const rows = await db<{ article_id: string; vote: Vote }[]>`
    SELECT article_id, vote FROM mafi_preference_reactions
    WHERE device_id = ${deviceId} AND article_id IN ${db(itemIds as string[])}`;
  for (const row of rows) out.set(row.article_id, row.vote);
  return out;
}

export async function readSourceCounts(deviceId: string, sourceIds: readonly string[], db: Db = sql): Promise<Map<string, SourceCounts>> {
  const out = new Map<string, SourceCounts>();
  for (const id of sourceIds) out.set(id, { ups: 0, downs: 0 });
  if (sourceIds.length === 0) return out;
  const rows = await db<{ source_id: string; ups: number; downs: number }[]>`
    SELECT source_id,
      count(*) FILTER (WHERE vote = 'up')::int AS ups,
      count(*) FILTER (WHERE vote = 'down')::int AS downs
    FROM mafi_preference_reactions
    WHERE device_id = ${deviceId} AND source_id IN ${db(sourceIds as string[])} AND vote IS NOT NULL
    GROUP BY source_id`;
  for (const row of rows) out.set(row.source_id, { ups: row.ups, downs: row.downs });
  return out;
}
```

Apply migrations via the repo's normal path (`npm run db:migrate` against the test/preview DB used by the harness — never against a production DB from this plan's automation).

- [ ] **Step 4: Run test to verify it passes**

Run the same `preferences.test.ts` command as Step 2.

Expected: PASS for the store tests.

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences/migrations modules/mafi-preferences/backend/store.ts modules/mafi-preferences/tests/preferences.test.ts
git commit -m "$(cat <<'EOF'
feat(mafi): persist device article preference reactions

EOF
)"
```

---

### Task 3: Device cookie identity + rate limit

**Files:**
- Create: `modules/mafi-preferences/backend/identity.ts`
- Create: `modules/mafi-preferences/backend/limits.ts`
- Modify: `modules/mafi-preferences/tests/preferences.test.ts` (add identity/limit unit tests; can stay in same file as pure + inject-free checks)

**Interfaces:**
- Consumes: `DEVICE_COOKIE`, `DEVICE_COOKIE_MAX_AGE_SEC` from contracts; `parseCookies` pattern from `packages/backend/src/admin/auth.ts` (copy the small pure helpers into identity — do **not** import admin session secrets)
- Produces:
  - `isDeviceId(value: string): boolean` — UUID v4 shape
  - `readDeviceId(cookieHeader: string | undefined): string | null`
  - `newDeviceId(): string` — `randomUUID()`
  - `deviceSetCookie(deviceId: string, secure: boolean): string` — HttpOnly; SameSite=Lax; Path=/; Max-Age=34560000; Secure iff `secure`
  - `checkReactionLimit(args: { deviceId: string | null; ip: string; now?: number }): { allowed: boolean; retryAfter: number }` — 60/min sustained, burst 10/1s, tracked separately per deviceId and per IP; deny if **either** bucket exhausted

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE_SEC } from "../contracts.ts";
import { deviceSetCookie, isDeviceId, newDeviceId, readDeviceId } from "../backend/identity.ts";
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
  for (let i = 0; i < 50; i++) {
    assert.equal(checkReactionLimit({ deviceId, ip, now + i * 10 }).allowed, true);
  }
  const denied = checkReactionLimit({ deviceId, ip, now: now + 50 * 10 });
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfter >= 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./tests/standalone.ts --test modules/mafi-preferences/tests/preferences.test.ts`

(If this file mixes DB tests, split identity/limit into `identity.standalone.test.ts` instead and run that — prefer standalone for this task.)

Expected: FAIL (missing identity/limits)

- [ ] **Step 3: Write minimal implementation**

```ts
// modules/mafi-preferences/backend/identity.ts
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
```

```ts
// modules/mafi-preferences/backend/limits.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences/backend/identity.ts modules/mafi-preferences/backend/limits.ts modules/mafi-preferences/tests
git commit -m "$(cat <<'EOF'
feat(mafi): add mafi_device cookie helpers and reaction rate limit

EOF
)"
```

---

### Task 4: `POST /api/site/reactions` (secure write API)

**Files:**
- Create: `modules/mafi-preferences/backend/http.ts`
- Create: `modules/mafi-preferences/module.ts`
- Create: `modules/mafi-preferences/server.ts`
- Modify: `site/modules/index.ts`, `site/modules/server.ts`
- Modify: `modules/mafi-preferences/tests/preferences.test.ts` (Fastify inject cases)

**Interfaces:**
- Consumes: store, identity, limits, `loadItemDetail` from `@aihot/backend/publication/detail`, `clientIp`/`sendProblem` patterns from `apps/api/src/http/respond.ts` (module may use Fastify reply directly with problem+json shape already used by feedback)
- Produces:
  - `POST /api/site/reactions` body `{ itemId: string; vote: "up" | "down" | null }`
  - Auth: `mafi_device` cookie; if absent on same-origin POST → create device, `Set-Cookie`, accept write
  - Response 200: `ReactionResult` + `Cache-Control: private, no-store`
  - Rejects: bad Origin / `Sec-Fetch-Site: cross-site` → 403; bad JSON/enum/id → 400; unknown/non-listable item → 404; over limit → 429

- [ ] **Step 1: Write the failing HTTP tests**

```ts
import Fastify from "fastify";
import test from "node:test";
import assert from "node:assert/strict";
import { createPreferenceServer } from "../server.ts";
import { DEVICE_COOKIE } from "../contracts.ts";
import { _resetLimitsForTest } from "../backend/limits.ts";

async function app() {
  const f = Fastify();
  createPreferenceServer().http!(f);
  return f;
}

test("POST reactions: set-on-first-write, idempotent, revoke, 404, origin, rate limit", async () => {
  _resetLimitsForTest();
  const f = await app();
  const { itemId } = await pickPublicItem(); // same helper as Task 2
  const origin = "http://localhost:3000";

  const first = await f.inject({
    method: "POST",
    url: "/api/site/reactions",
    headers: { origin, "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
    payload: { itemId, vote: "up" },
  });
  assert.equal(first.statusCode, 200);
  assert.match(String(first.headers["set-cookie"]), new RegExp(DEVICE_COOKIE));
  assert.equal(first.headers["cache-control"], "private, no-store");
  assert.equal(first.json().myVote, "up");
  const cookie = String(first.headers["set-cookie"]).split(";")[0];

  const dup = await f.inject({
    method: "POST",
    url: "/api/site/reactions",
    headers: { origin, cookie, "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
    payload: { itemId, vote: "up" },
  });
  assert.equal(dup.statusCode, 200);
  assert.equal(dup.json().myVote, "up");

  const revoke = await f.inject({
    method: "POST",
    url: "/api/site/reactions",
    headers: { origin, cookie, "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
    payload: { itemId, vote: null },
  });
  assert.equal(revoke.statusCode, 200);
  assert.equal(revoke.json().myVote, null);

  const missing = await f.inject({
    method: "POST",
    url: "/api/site/reactions",
    headers: { origin, cookie, "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
    payload: { itemId: "no-such-item-id-zzzz", vote: "down" },
  });
  assert.equal(missing.statusCode, 404);

  const cross = await f.inject({
    method: "POST",
    url: "/api/site/reactions",
    headers: { origin: "https://evil.example", cookie, "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
    payload: { itemId, vote: "down" },
  });
  assert.equal(cross.statusCode, 403);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run DB harness test file. Expected: FAIL (route missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// modules/mafi-preferences/module.ts
import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "mafi-preferences",
  apiPaths: [/^\/api\/site\/reactions$/],
});
```

```ts
// modules/mafi-preferences/backend/http.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loadItemDetail } from "@aihot/backend/publication/detail";
import { config } from "@aihot/backend/config";
import { sql } from "@aihot/backend/db";
import { ITEM_ID_RE, type Vote } from "../contracts.ts";
import { deviceSetCookie, newDeviceId, readDeviceId } from "./identity.ts";
import { checkReactionLimit } from "./limits.ts";
import { setReaction } from "./store.ts";

function siteOrigin(): string {
  return new URL(config.siteUrl).origin;
}

function sameOrigin(req: FastifyRequest): boolean {
  const site = siteOrigin();
  const origin = req.headers.origin;
  if (origin === "null") return false;
  if (origin) return origin === site;
  const fetchSite = String(req.headers["sec-fetch-site"] ?? "");
  if (fetchSite === "cross-site") return false;
  return true;
}

function clientIp(req: FastifyRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0]!.trim();
  return req.ip;
}

function secureCookie(): boolean {
  return new URL(config.siteUrl).protocol === "https:";
}

function problem(reply: FastifyReply, status: number, code: string, detail: string, retryAfter?: number) {
  if (retryAfter) reply.header("Retry-After", retryAfter);
  return reply.code(status).header("Cache-Control", "private, no-store").type("application/problem+json").send({
    type: `https://aihot.news/problems/${code}`,
    title: code,
    status,
    detail,
  });
}

export function registerReactionRoutes(app: FastifyInstance) {
  app.post("/api/site/reactions", { bodyLimit: 1024 }, async (req, reply) => {
    if (!sameOrigin(req)) return problem(reply, 403, "forbidden", "cross-origin reaction rejected");
    const ip = clientIp(req);
    let deviceId = readDeviceId(req.headers.cookie);
    const limit = checkReactionLimit({ deviceId, ip });
    if (!limit.allowed) return problem(reply, 429, "rate_limited", "too many reactions", limit.retryAfter);

    const body = req.body as { itemId?: unknown; vote?: unknown };
    if (!body || typeof body !== "object") return problem(reply, 400, "invalid_request", "JSON body required");
    const itemId = body.itemId;
    const vote = body.vote as Vote | undefined;
    if (typeof itemId !== "string" || !ITEM_ID_RE.test(itemId)) return problem(reply, 400, "invalid_request", "invalid itemId");
    if (!(vote === "up" || vote === "down" || vote === null)) return problem(reply, 400, "invalid_request", "vote must be up, down, or null");

    const detail = await loadItemDetail(itemId);
    if (detail.kind === "not_found") return problem(reply, 404, "not_found", "item not found");

    const [pub] = await sql<{ source_id: string }[]>`
      SELECT source_id FROM publications WHERE article_id = ${itemId} LIMIT 1`;
    if (!pub) return problem(reply, 404, "not_found", "item not found");

    let created = false;
    if (!deviceId) {
      deviceId = newDeviceId();
      created = true;
    }
    const result = await setReaction(deviceId, itemId, vote, pub.source_id);
    reply.header("Cache-Control", "private, no-store");
    if (created) reply.header("Set-Cookie", deviceSetCookie(deviceId, secureCookie()));
    else reply.header("Set-Cookie", deviceSetCookie(deviceId, secureCookie())); // renew 400d on successful write
    return reply.send(result);
  });
}
```

```ts
// modules/mafi-preferences/server.ts
import type { ServerModule } from "@aihot/backend/modules";
import { registerReactionRoutes } from "./backend/http.ts";

export function createPreferenceServer(): ServerModule {
  return {
    name: "mafi-preferences",
    http(app) {
      app.addHook("onRequest", async (request, reply) => {
        if (request.url.split("?")[0] === "/api/site/reactions") {
          reply.header("Cache-Control", "private, no-store");
          reply.header("X-Robots-Tag", "noindex, nofollow, noarchive");
        }
      });
      registerReactionRoutes(app);
    },
  };
}

export default createPreferenceServer();
```

Wire:

```ts
// site/modules/index.ts — add import preferences from "@aihot/mafi-preferences/module";
// export const MODULES = [readers, preferences];

// site/modules/server.ts — add import preferences from "@aihot/mafi-preferences/server";
// export const SERVER_MODULES = [readers, preferences];
```

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS for HTTP cases (duplicate / revoke / 404 / 403). Add a dedicated burst test that expects 429 after >10 rapid POSTs.

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences site/modules/index.ts site/modules/server.ts
git commit -m "$(cat <<'EOF'
feat(mafi): add private POST /api/site/reactions

EOF
)"
```

---

### Task 5: Window evidence + preference projection helpers

**Files:**
- Create: `modules/mafi-preferences/backend/views.ts`
- Modify: `packages/backend/src/modules.ts` only if a typed optional socket is clearly useful; otherwise keep helpers on the preference `ServerModule` object and cast in `apps/api` (preferred)
- Modify: `packages/backend/src/publication/pool.ts` — add `loadPoolReaderWindow` returning public `PoolResponse` **plus** internal candidates `{ itemId, sourceId, publicBaseScore, publicTimeMs }[]` for the same page only
- Modify: `packages/backend/src/publication/timeline.ts` — add `loadTimelineReaderWindow` with per-card members for group keys (`factId` or item id)
- Modify: `packages/backend/src/publication/stories.ts` (and/or `hot.ts`) — add hot-window candidate evidence for `/api/site/hot` entries that have `itemId`s / participant item ids
- Modify: `packages/contracts/src/site.ts` — optional `myVote?: "up" | "down" | null` on `FeedItemSummary` / `ItemSummary`
- Modify: `modules/mafi-preferences/tests/preferences.test.ts` (projection tests)

**Interfaces:**
- Consumes: `reorderFlat` / `reorderGrouped` / `readVotes` / `readSourceCounts` / `articleWeight` path via weights
- Produces:
  - `export interface ReaderCandidate { itemId: string; sourceId: string; publicBaseScore: number; publicTimeMs: number; groupKey?: string }`
  - `export function projectPool(data: PoolResponse, candidates: ReaderCandidate[], votes: Map<string, Vote>, counts: Map<string, SourceCounts>): PoolResponse`
  - `export function projectTimeline(data: TimelineResponse, candidates: ReaderCandidate[], votes: Map<string, Vote>, counts: Map<string, SourceCounts>): TimelineResponse`
  - `export function projectHot(data: HotResponse, candidates: ReaderCandidate[], votes: Map<string, Vote>, counts: Map<string, SourceCounts>): HotResponse`
  - Public loader return values stay byte-stable when preference module is absent. Window helpers must not change SQL eligibility (`listedCondition` / `listingFreshCondition` / `LISTING_FLOOR_BEIJING_DATE`).
  - `publicBaseScore`: pool time-tab = `sort_at` epoch ms; pool relevance = `rel`; timeline card = `Date.parse(anchorAt)`; hot entry = `heat` (or existing public heat field). Votes never add/remove candidates.

- [ ] **Step 1: Write the failing projection test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { projectPool } from "../backend/views.ts";
import type { PoolResponse } from "@aihot/contracts/site";
import type { ReaderCandidate } from "../backend/views.ts";

test("projectPool reorders page window and stamps myVote without changing pageCount", () => {
  const data = {
    filters: { channel: "all", category: null, tag: null, q: null, tab: "time" },
    items: [
      { id: "a", title: "A", summary: null, reason: null, source: { name: "S" }, publishedAt: null, timelineAt: "2026-10-24T00:00:00.000Z", category: null, tags: [], score: 1, selected: false, channel: "news", x: null },
      { id: "b", title: "B", summary: null, reason: null, source: { name: "S" }, publishedAt: null, timelineAt: "2026-10-24T00:00:00.000Z", category: null, tags: [], score: 1, selected: false, channel: "news", x: null },
    ],
    page: 1,
    pageCount: 3,
    total: 80,
    dayCounts: {},
  } as PoolResponse;
  const candidates: ReaderCandidate[] = [
    { itemId: "a", sourceId: "src", publicBaseScore: 100, publicTimeMs: 2 },
    { itemId: "b", sourceId: "src", publicBaseScore: 90, publicTimeMs: 1 },
  ];
  const votes = new Map([["a", "down" as const]]);
  const counts = new Map([["src", { ups: 0, downs: 1 }]]);
  const out = projectPool(data, candidates, votes, counts);
  assert.equal(out.pageCount, 3);
  assert.equal(out.total, 80);
  assert.equal(out.items[0]!.id, "b");
  assert.equal(out.items[1]!.id, "a");
  assert.equal(out.items[1]!.myVote, "down");
  assert.equal(out.items[0]!.myVote, null);
});
```

Add analogous timeline group test: two members same `groupKey`, one down — group still ranks by max member key; down member sorts after sibling inside group.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (views missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// modules/mafi-preferences/backend/views.ts
import type { FeedItemSummary, HotResponse, PoolResponse, TimelineResponse } from "@aihot/contracts/site";
import type { SourceCounts, Vote } from "../contracts.ts";
import { reorderFlat, reorderGrouped, type Rankable } from "./weights.ts";

export interface ReaderCandidate {
  itemId: string;
  sourceId: string;
  publicBaseScore: number;
  publicTimeMs: number;
  groupKey?: string;
}

function stamp(item: FeedItemSummary, vote: Vote | undefined): FeedItemSummary {
  return { ...item, myVote: vote ?? null };
}

export function projectPool(
  data: PoolResponse,
  candidates: readonly ReaderCandidate[],
  votes: Map<string, Vote>,
  counts: Map<string, SourceCounts>,
): PoolResponse {
  const byId = new Map(data.items.map((i) => [i.id, i]));
  const ranked: (Rankable & { item: FeedItemSummary })[] = [];
  for (const c of candidates) {
    const item = byId.get(c.itemId);
    if (!item) continue;
    const vote = votes.get(c.itemId) ?? null;
    ranked.push({
      id: c.itemId,
      publicBaseScore: c.publicBaseScore,
      publicTimeMs: c.publicTimeMs,
      vote,
      sourceCounts: counts.get(c.sourceId) ?? { ups: 0, downs: 0 },
      item: stamp(item, vote),
    });
  }
  return { ...data, items: reorderFlat(ranked).map((r) => r.item) };
}

export function projectTimeline(
  data: TimelineResponse,
  candidates: readonly ReaderCandidate[],
  votes: Map<string, Vote>,
  counts: Map<string, SourceCounts>,
): TimelineResponse {
  const byId = new Map(data.cards.map((c) => [c.item.id, c]));
  const ranked: (Rankable & { key: string })[] = [];
  for (const c of candidates) {
    const card = byId.get(c.itemId);
    if (!card) continue;
    const vote = votes.get(c.itemId) ?? null;
    ranked.push({
      id: c.itemId,
      groupKey: c.groupKey,
      publicBaseScore: c.publicBaseScore,
      publicTimeMs: c.publicTimeMs,
      vote,
      sourceCounts: counts.get(c.sourceId) ?? { ups: 0, downs: 0 },
      key: card.key,
    });
  }
  const order = reorderGrouped(ranked);
  const cards = order.map((r) => {
    const card = byId.get(r.id)!;
    return { ...card, item: stamp(card.item, r.vote) };
  });
  // Hot strip on the same response: if candidates include strip members, project separately in caller.
  return { ...data, cards };
}
```

In `pool.ts` / `timeline.ts`, add thin wrappers that run the **existing** public query then map each returned row to `ReaderCandidate` using `p.source_id` (already on publications; select it in the window helper even though `ITEM_COLUMNS` omits it today). Do not change `loadPool` / `loadTimeline` public signatures used by unauthenticated routes.

```ts
// packages/contracts/src/site.ts — on ItemSummary and FeedItemSummary:
/** Present only on device-personalized responses; omitted on public cache payloads. */
myVote?: "up" | "down" | null;
```

```ts
// packages/backend/src/modules.ts — inside ServerModule:
/**
 * Optional per-device reading-view projection. Engine public loaders stay cookie-free;
 * site routes call this only when a device cookie is present.
 */
readerView?: {
  resolve: (cookieHeader: string | undefined) => Promise<{ deviceId: string } | null>;
  // Concrete apply lives in the module; site routes call module helpers with window evidence.
};
```

Do **not** create `packages/backend/src/site/reader-view.ts` with a hard import of `modules/mafi-preferences/*` (that would break the open-source engine). Instead:

1. Extend the preference `ServerModule` object in `modules/mafi-preferences/server.ts` with concrete helpers typed locally:
   `resolveDevice(cookieHeader)`, `personalizePool(...)`, `personalizeTimeline(...)`, `personalizeHot(...)`, `personalizeItem(...)`.
2. In `apps/api/src/routes/site.ts`, locate the installed module by `name === "mafi-preferences"` from the site’s `SERVER_MODULES` list (already loaded by the API) and call those helpers through a local interface cast. Engine `packages/backend` never imports the module.

- [ ] **Step 4: Run tests**

Expected: projection unit tests PASS; existing `tests/timeline-*.test.ts` / pool tests still PASS without cookie.

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences packages/contracts/src/site.ts packages/backend/src/publication/pool.ts packages/backend/src/publication/timeline.ts packages/backend/src/publication/stories.ts packages/backend/src/publication/hot.ts packages/backend/src/modules.ts
git commit -m "$(cat <<'EOF'
feat(mafi): project device preference onto public feed windows

EOF
)"
```

---

### Task 6: Wire personalized site list/detail responses

**Files:**
- Modify: `apps/api/src/routes/site.ts`
- Modify: `apps/web/app/lib/api.server.ts` (forward `cookie` request header to API for home/all/hot/item loaders; when upstream `Cache-Control` is private/no-store, `cachedPage` must not advertise public caching)
- Modify: `apps/web/app/routes/home.tsx`, `all.tsx`, `hot.tsx`, `item.tsx`, `item-original.tsx` (pass `request` into loaders so cookies forward)
- Extend: `modules/mafi-preferences/tests/preferences.test.ts` + `tests/public-cache.test.ts` if present

**Interfaces:**
- Consumes: Task 4–5 personalize helpers; existing `sendJsonWithEtag` for **public** path only
- Produces: When `mafi_device` present and valid → personalized JSON with `myVote`, **no ETag/304**, headers `Cache-Control: private, no-store` (+ `X-Accel-Expires: 0` if that header is already used elsewhere). When cookie absent → today's public ETag path unchanged (no `myVote` field).

- [ ] **Step 1: Write the failing cache isolation test**

```ts
test("timeline with device cookie is private and ordered; without cookie stays public", async () => {
  const f = await buildApp(); // existing test app harness
  const publicRes = await f.inject({ method: "GET", url: "/api/site/timeline" });
  assert.match(String(publicRes.headers["cache-control"]), /public/);
  assert.equal(publicRes.json().cards[0]?.item?.myVote, undefined);

  // seed a downvote for device D on the first public card's item via store/API
  const cookie = `${DEVICE_COOKIE}=${DEVICE_A}`;
  const privateRes = await f.inject({ method: "GET", url: "/api/site/timeline", headers: { cookie } });
  assert.equal(privateRes.headers["cache-control"], "private, no-store");
  assert.equal(privateRes.headers.etag, undefined);
  // first card item that was downvoted is not before an unvoted higher-base peer in-window
  assert.ok(privateRes.json().cards.some((c: { item: { myVote: string | null } }) => c.item.myVote === "down"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (site routes still public-only; file header still says "no cookies are read or set")

- [ ] **Step 3: Write minimal implementation**

In `registerSite` for `timeline`, `pool`, `hot`, and `items/:id`:

1. Read device id from cookie via preference module helper (if module installed).
2. If none → existing `loadX` + `sendJsonWithEtag` public path.
3. If present → `loadXReaderWindow` → `readVotes`/`readSourceCounts` → `projectX` → `reply.header("Cache-Control","private, no-store").header("X-Accel-Expires","0").send(body)` (no ETag).

Update the top-of-file comment in `site.ts` to: public path remains cookie-free; personalized path reads `mafi_device` only.

`api.server.ts` `loadOr404`:

```ts
export async function loadOr404<T>(path: string, opts: {
  busyRedirect?: string;
  merged?: (id: string) => string;
  responseHeaders?: Headers;
  signal?: AbortSignal;
  request?: Request; // NEW: when set, forward Cookie
} = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const cookie = opts.request?.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  // ...existing fetch to API with headers, credentials omitted server-side...
}
```

`cachedPage`: if `upstream.get("cache-control")` includes `private`, return headers that force `private, no-store` and `expiresAt: 0` for `pageReuse`.

- [ ] **Step 4: Run tests**

Expected: new isolation test PASS; public-cache regression PASS; no collect tests touched.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/site.ts apps/web/app/lib/api.server.ts apps/web/app/routes/home.tsx apps/web/app/routes/all.tsx apps/web/app/routes/hot.tsx apps/web/app/routes/item.tsx apps/web/app/routes/item-original.tsx modules/mafi-preferences/tests tests
git commit -m "$(cat <<'EOF'
feat(mafi): private personalized site feeds with myVote

EOF
)"
```

---

### Task 7: Black-gold thumbs UI on cards + content page

**Files:**
- Create: `modules/mafi-preferences/web/actions.tsx`
- Create: `modules/mafi-preferences/web/controller.ts`
- Create: `modules/mafi-preferences/web.tsx`
- Modify: `site/modules/web.ts`
- Modify: `apps/web/app/modules.ts` — add optional `itemActions`
- Create: `apps/web/app/features/item/ModuleItemActions.tsx`
- Modify: `apps/web/app/features/feed/FeedItem.tsx` — render actions next to `StarButton`
- Modify: `apps/web/app/routes/item.tsx` — desktop star row
- Modify: `apps/web/app/features/item/ReaderTools.tsx` — phone toolbar slot (extend grid; do not use green accents)
- Create: `apps/web/tests/preferences.test.ts` (render / toggle smoke with fake fetch)

**Interfaces:**
- Consumes: `ReactionResult`, `Vote`; `submitReaction` posts to `/api/site/reactions` with `credentials: "same-origin"`, `cache: "no-store"`
- Produces:
  - `ItemActionProps = { itemId: string; myVote?: Vote; placement: "card" | "article" | "phone" }`
  - `ThumbsButtons` — up/down toggle; re-click same → `null`; other → switch; `aria-pressed`; labels exactly `赞同` / `不感兴趣`; no green fills; use existing `text-accent` gold + metal borders `border-line-strong` / `text-ink-4`
  - `WebModule.itemActions?: Array<{ key: string; Component: ComponentType<ItemActionProps> }>`
  - After successful write: dispatch `mafi:preferences-changed` CustomEvent on `window` with `{ itemId, myVote }`

- [ ] **Step 1: Write the failing UI test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
// Use the repo's existing web test renderer if present; otherwise test controller pure toggle logic:

import { nextVote } from "../../modules/mafi-preferences/web/controller.ts";

test("nextVote toggles and switches", () => {
  assert.equal(nextVote(null, "up"), "up");
  assert.equal(nextVote("up", "up"), null);
  assert.equal(nextVote("up", "down"), "down");
  assert.equal(nextVote("down", "down"), null);
  assert.equal(nextVote(null, "down"), "down");
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// modules/mafi-preferences/web/controller.ts
import type { ReactionResult, Vote } from "../contracts.ts";

export function nextVote(current: Vote | undefined, clicked: "up" | "down"): Vote {
  if (current === clicked) return null;
  return clicked;
}

export async function submitReaction(itemId: string, vote: Vote): Promise<ReactionResult> {
  const res = await fetch("/api/site/reactions", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ itemId, vote }),
  });
  if (res.status === 429) throw Object.assign(new Error("rate_limited"), { status: 429 });
  if (!res.ok) throw Object.assign(new Error("reaction_failed"), { status: res.status });
  const body = (await res.json()) as ReactionResult;
  window.dispatchEvent(new CustomEvent("mafi:preferences-changed", { detail: body }));
  return body;
}
```

```tsx
// modules/mafi-preferences/web/actions.tsx
import { useState } from "react";
import type { Vote } from "../contracts.ts";
import { nextVote, submitReaction } from "./controller.ts";

export interface ItemActionProps {
  itemId: string;
  myVote?: Vote;
  placement: "card" | "article" | "phone";
}

function Thumb({
  kind, pressed, busy, onClick, placement,
}: {
  kind: "up" | "down";
  pressed: boolean;
  busy: boolean;
  onClick: () => void;
  placement: ItemActionProps["placement"];
}) {
  const label = kind === "up" ? "赞同" : "不感兴趣";
  const glyph = kind === "up" ? "👍" : "👎";
  const size = placement === "phone" ? "size-11 text-[15px]" : placement === "article" ? "size-8 text-[14px]" : "size-11 lg:size-[26px] text-[13px] lg:text-[12px]";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={busy}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`relative z-10 inline-flex shrink-0 items-center justify-center rounded-control border transition-colors duration-150 ${size} ${
        pressed
          ? "border-accent/70 bg-bg-sunk text-accent"
          : "border-transparent text-ink-4 hover:border-line-strong hover:bg-bg-sunk hover:text-ink-2"
      } disabled:opacity-50`}
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}

export function ThumbsButtons({ itemId, myVote = null, placement }: ItemActionProps) {
  const [vote, setVote] = useState<Vote>(myVote ?? null);
  const [busy, setBusy] = useState(false);
  const click = async (kind: "up" | "down") => {
    const desired = nextVote(vote, kind);
    const prev = vote;
    setVote(desired);
    setBusy(true);
    try {
      const result = await submitReaction(itemId, desired);
      setVote(result.myVote);
    } catch {
      setVote(prev);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex items-center gap-0.5">
      <Thumb kind="up" pressed={vote === "up"} busy={busy} placement={placement} onClick={() => void click("up")} />
      <Thumb kind="down" pressed={vote === "down"} busy={busy} placement={placement} onClick={() => void click("down")} />
    </span>
  );
}
```

```tsx
// modules/mafi-preferences/web.tsx
import { defineWebModule } from "@aihot/web/modules";
import { ThumbsButtons } from "./web/actions.tsx";

export default defineWebModule({
  name: "mafi-preferences",
  itemActions: [{ key: "thumbs", Component: ThumbsButtons }],
});
```

Extend `WebModule` in `apps/web/app/modules.ts`:

```ts
itemActions?: Array<{ key: string; Component: ComponentType<{ itemId: string; myVote?: "up" | "down" | null; placement: "card" | "article" | "phone" }> }>;
```

```tsx
// apps/web/app/features/item/ModuleItemActions.tsx
import { webModules } from "../../site-modules";

export function ModuleItemActions(props: { itemId: string; myVote?: "up" | "down" | null; placement: "card" | "article" | "phone" }) {
  return (
    <>
      {webModules().flatMap((m) => m.itemActions ?? []).map((action) => (
        <action.Component key={action.key} {...props} />
      ))}
    </>
  );
}
```

In `FeedItem.tsx` header actions (beside `StarButton`):

```tsx
<span className="-my-[11px] inline-flex lg:-my-1">
  <ModuleItemActions itemId={item.id} myVote={item.myVote} placement="card" />
</span>
<span className="-my-[11px] -mr-3 inline-flex lg:-my-1 lg:mr-0">
  <StarButton item={item} className="size-11 lg:size-[26px]" />
</span>
```

Mirror next to the desktop `StarButton` in `item.tsx` with `placement="article"`, and add a thumbs tool in `ReaderToolbar` with `placement="phone"` (expand grid cols carefully so 390px width still fits).

Wire `site/modules/web.ts` to include preferences web module.

**Aesthetic check:** no `text-emerald` / status-green classes on thumbs; pressed state uses accent gold only.

- [ ] **Step 4: Run tests**

Expected: controller test PASS; typecheck for web module PASS (`npm run typecheck -w @aihot/web` or repo `npm run typecheck`).

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences/web modules/mafi-preferences/web.tsx site/modules/web.ts apps/web/app/modules.ts apps/web/app/features/item/ModuleItemActions.tsx apps/web/app/features/feed/FeedItem.tsx apps/web/app/routes/item.tsx apps/web/app/features/item/ReaderTools.tsx apps/web/tests/preferences.test.ts
git commit -m "$(cat <<'EOF'
feat(mafi): add black-gold thumbs controls on cards and article

EOF
)"
```

---

### Task 8: Client refresh after vote (动态 page-1 + 精选 cursor reset)

**Files:**
- Modify: `modules/mafi-preferences/web/controller.ts` (ensure event always fires on success)
- Modify: `apps/web/app/features/feed/Timeline.tsx` — listen for `mafi:preferences-changed`; abort in-flight page; set `nextCursor` path back to head (clear cards → refetch `/api/site/timeline` without cursor, same filters)
- Modify: `apps/web/app/routes/all.tsx` — on event, `navigate` to same query with `page` removed/1 (preserve category/channel/tag/q/tab)
- Modify: `apps/web/app/features/feed/DayList.tsx` only if list identity keys break after reorder (prefer stable `item.id` keys — already true)
- Extend: `apps/web/tests/preferences.test.ts`

**Interfaces:**
- Consumes: `mafi:preferences-changed` event from Task 7
- Produces: After any successful reaction that affects listing surfaces, 精选 Timeline behaves as “cursor = null + refetch page 1 head”; 动态 `/all` resets to page 1. Hot page can `revalidator.revalidate()`. Do not rely on old cursors after a vote.

- [ ] **Step 1: Write the failing test**

```ts
test("preferences-changed handler builds all href at page 1 keeping filters", () => {
  const sp = new URLSearchParams("category=models&page=3&channel=news");
  sp.delete("page");
  assert.equal(sp.get("page"), null);
  assert.equal(sp.get("category"), "models");
});
```

Add a Timeline unit-style test: given state with `nextCursor: "abc"` and cards length > 0, invoking the reset helper yields `nextCursor` from a fresh head fetch mock (mock `fetch`).

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL until helpers exist

- [ ] **Step 3: Write minimal implementation**

In `Timeline.tsx` (inside the component):

```ts
useEffect(() => {
  const onPref = () => {
    pageRequest.current?.abort();
    pageRequest.current = null;
    const controller = new AbortController();
    pageRequest.current = controller;
    void (async () => {
      try {
        const res = await fetch(listPath("/api/site/timeline", filterParams(filters)), {
          signal: controller.signal,
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const page = (await res.json()) as TimelineResponse;
        setState({
          version: 2,
          cards: page.cards,
          nextCursor: page.nextCursor,
          dayCounts: page.dayCounts,
          collapsed: [],
          batches: 1,
          unreadOnly: false,
        });
      } catch {
        /* aborted */
      } finally {
        if (pageRequest.current === controller) pageRequest.current = null;
      }
    })();
  };
  window.addEventListener("mafi:preferences-changed", onPref);
  return () => window.removeEventListener("mafi:preferences-changed", onPref);
}, [filters]);
```

In `all.tsx`:

```ts
useEffect(() => {
  const onPref = () => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("page") && sp.get("page") !== "1") {
      sp.delete("page");
      navigate(`/all?${sp.toString()}`, { replace: true });
    } else {
      // already page 1 — force revalidation
      void revalidator.revalidate();
    }
  };
  window.addEventListener("mafi:preferences-changed", onPref);
  return () => window.removeEventListener("mafi:preferences-changed", onPref);
}, [navigate, revalidator]);
```

(Use `useNavigate` / `useRevalidator` from react-router — already imported patterns in sibling routes.)

- [ ] **Step 4: Run tests**

Expected: PASS; manual smoke on preview: vote on page 3 of `/all` lands on page 1; vote on `/` refetches head.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/features/feed/Timeline.tsx apps/web/app/routes/all.tsx apps/web/tests/preferences.test.ts modules/mafi-preferences/web/controller.ts
git commit -m "$(cat <<'EOF'
feat(mafi): reset feed pagination after preference vote

EOF
)"
```

---

### Task 9: Security & acceptance checklist tests

**Files:**
- Modify: `modules/mafi-preferences/tests/preferences.test.ts` (complete acceptance matrix)
- Create: `docs/mafi-preferences.md` (operator note: cookie meaning, no collect impact, how to clear by deleting cookie; no marketing promises)
- Modify: `site/pages/privacy.md` only if it already documents cookies — add one factual sentence about `mafi_device` (no new legal invention beyond “anonymous device id for reading preference”)

**Interfaces:**
- Consumes: all prior APIs
- Produces: automated coverage for the spec acceptance table; explicit assertion that `scheduleDueSources` / source `interval_minutes` are unchanged by voting (read before/after in DB)

- [ ] **Step 1: Write the failing acceptance tests**

```ts
test("acceptance matrix", async () => {
  _resetLimitsForTest();
  const f = await app();
  const { itemId, sourceId } = await pickPublicItem();
  const origin = new URL((await import("@aihot/backend/config")).config.siteUrl).origin;
  const ip = "198.51.100.50";

  const post = (headers: Record<string, string>, payload: object) =>
    f.inject({ method: "POST", url: "/api/site/reactions", headers: { origin, "content-type": "application/json", "x-forwarded-for": ip, ...headers }, payload });

  const first = await post({}, { itemId, vote: "up" });
  assert.equal(first.statusCode, 200);
  const cookie = String(first.headers["set-cookie"]).split(";")[0]!;
  const dup = await post({ cookie }, { itemId, vote: "up" });
  assert.equal(dup.statusCode, 200);
  assert.equal(dup.json().myVote, "up");

  const revoked = await post({ cookie }, { itemId, vote: null });
  assert.equal(revoked.statusCode, 200);
  assert.equal(revoked.json().myVote, null);
  const [retained] = await sql<{ vote: string | null }[]>`
    SELECT vote FROM mafi_preference_reactions WHERE article_id = ${itemId} AND device_id = ${readDeviceId(cookie)}`;
  assert.ok(retained);
  assert.equal(retained.vote, null);

  await Promise.all([
    post({ cookie }, { itemId, vote: "up" }),
    post({ cookie }, { itemId, vote: "down" }),
  ]);
  const finalVote = (await readVotes(readDeviceId(cookie)!, [itemId])).get(itemId) ?? null;
  assert.ok(finalVote === "up" || finalVote === "down");

  const cross = await post({ cookie, origin: "https://evil.example" }, { itemId, vote: "up" });
  assert.equal(cross.statusCode, 403);

  const missing = await post({ cookie }, { itemId: "no-such-item-id-zzzz", vote: "up" });
  assert.equal(missing.statusCode, 404);

  _resetLimitsForTest();
  let saw429 = false;
  for (let i = 0; i < 20; i++) {
    const r = await post({ cookie, "x-forwarded-for": "198.51.100.77" }, { itemId, vote: i % 2 ? "up" : "down" });
    if (r.statusCode === 429) { saw429 = true; break; }
  }
  assert.equal(saw429, true);

  const pub = await f.inject({ method: "GET", url: "/api/site/pool" });
  assert.match(String(pub.headers["cache-control"]), /public/);
  assert.equal(pub.json().items?.[0]?.myVote, undefined);

  const priv = await f.inject({ method: "GET", url: "/api/site/pool", headers: { cookie } });
  assert.equal(priv.headers["cache-control"], "private, no-store");
  assert.ok(priv.json().items.some((it: { id: string; myVote?: string | null }) => it.id === itemId ? it.myVote === finalVote : true));
});

test("voting does not change collect intervals", async () => {
  const before = await sql<{ id: string; interval_minutes: number; next_fetch_at: Date | null }[]>`
    SELECT id, interval_minutes, next_fetch_at FROM sources ORDER BY id`;
  const { itemId, sourceId } = await pickPublicItem();
  await ensureDeviceRow(DEVICE_A);
  await setReaction(DEVICE_A, itemId, "down", sourceId);
  const after = await sql<{ id: string; interval_minutes: number; next_fetch_at: Date | null }[]>`
    SELECT id, interval_minutes, next_fetch_at FROM sources ORDER BY id`;
  assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) {
    assert.equal(after[i]!.id, before[i]!.id);
    assert.equal(after[i]!.interval_minutes, before[i]!.interval_minutes);
    assert.equal(String(after[i]!.next_fetch_at), String(before[i]!.next_fetch_at));
  }
});
```

- [ ] **Step 2: Run tests — expect gaps to fail until filled**

- [ ] **Step 3: Fill any missing assertions / docs**

Smoke checklist (manual on AIPC preview after implementation — record results in the PR/commit message, not secrets):

1. Thumbs visible on `/all` cards and `/items/:id` (black-gold, beside star).
2. Vote survives refresh (cookie present).
3. Feeds reorder; unvoted browser matches public order.
4. Collect/status unchanged; selected seats unchanged in admin/DB.
5. Rebuild web; local commit only; no push.

- [ ] **Step 4: Run full relevant suites**

```bash
npm run typecheck
node --import ./tests/standalone.ts --test modules/mafi-preferences/tests/weights.standalone.test.ts
node --test-global-setup=tests/databases.ts --import ./tests/databases.ts --test modules/mafi-preferences/tests/preferences.test.ts
npm test
```

Expected: PASS for preference suites; no collect regressions.

- [ ] **Step 5: Commit**

```bash
git add modules/mafi-preferences/tests docs/mafi-preferences.md site/pages/privacy.md
git commit -m "$(cat <<'EOF'
test(mafi): acceptance coverage for thumbs preference security

EOF
)"
```

---

## Self-review (against revised spec)

| Spec requirement | Task |
|------------------|------|
| Approach B device cookie + server store; nullable user_id reserved | 2, 3, 4 |
| UI on FeedItem + content page; toggle; black-gold | 7 |
| articleWeight / sourceWeight / prefFactor / finalSortKey numbers | 1, 5 |
| 动态 window reorder + pagination reset | 5, 6, 8 (`/all` page) + timeline cursor reset on 精选 |
| 精选/热点 item-only demote; group max | 1 (`reorderGrouped`), 5, 6 |
| Public isolation; private no-store; cookie forward; no global seat mutation | 6 |
| POST `/api/site/reactions`; set-on-first-write; security table | 3, 4, 9 |
| Collect downshift OUT OF SCOPE | Global Constraints; Task 9 asserts unchanged intervals; **no task edits collect.ts** |
| LISTING_FLOOR unchanged; votes don't expand/shrink set | 5 |
| Acceptance matrix | 9 |
| Local commit only / no push | every Commit step |

**Placeholder scan:** none of TBD/TODO/"similar to Task N" remain in executable steps.

**Type consistency:** `Vote`, `SourceCounts`, `ReactionResult`, `ReaderCandidate`, `myVote`, `DEVICE_COOKIE` names are shared across tasks as defined in Task 1–2.

**Product naming ambiguity (do not invent a rename):** Spec §3 title "动态 (timeline)" describes cursor/limit behavior that the codebase implements on **精选** `/` via `loadTimeline`. The UI label **动态** is `/all` via `loadPool` (page). This plan applies preference to **both** and uses each surface's native pagination reset. Confirm with product owner only if one surface should be excluded — default per Global Constraints item 9 is both + 热点.

**Open engine wiring note:** Engine packages must not hard-depend on `modules/mafi-preferences`. Task 5–6 keep personalization behind the installed `ServerModule` / site route cast. If a cleaner typed socket is preferred during implementation, add `readerView` to `ServerModule` without importing the module from `packages/backend`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-26-mafi-thumbs-preference.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks (`superpowers:subagent-driven-development`)
2. **Inline Execution** — execute tasks in-session with checkpoints (`superpowers:executing-plans`)

Which approach?
