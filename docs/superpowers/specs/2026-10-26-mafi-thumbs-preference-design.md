# MAFi article thumbs preference (device-scoped)

**Date:** 2026-10-26 (Asia/Tokyo)  
**Revised:** 2026-10-26 (Asia/Tokyo) — review gaps closed; collect downshift deferred  
**Status:** Approved design — Approach B (reading preference only for v1)  
**Scope:** Design only; **do not start implementation** until this revision is accepted. Local commit; no push.

## Goal

On 动态 list cards and article content pages, add 👍 / 👎 so the system personalizes **that device’s reading view**:

- Downvoted **articles** get less exposure in that device’s feeds.
- Downvoted **sources** get lower weight in that device’s ranking / presentation order.
- Upvoted articles / sources get a mild boost for that device.
- No vote → existing public behavior unchanged for that device.

**v1 does not change collect frequency, global scores, global 精选 seats, daily reports, or public unauthenticated payloads.**

## Approach (chosen: B)

Anonymous device cookie + server-side storage and **per-device view reordering** (not pure localStorage). Account login merge is deferred.

---

## §1 Identity & UI

### UI placement

- Thumbs buttons sit next to the bookmark star on:
  - `FeedItem` (动态 list cards)
  - Article content page
- Visual language: black-gold aesthetic consistent with MAFi chrome.

### Vote states

| State | Meaning |
|-------|---------|
| none | No preference recorded |
| up | 👍 |
| down | 👎 |

Behavior:

- Re-click the **same** vote → cancel (back to none / `null`).
- Click the **other** vote → switch (up ↔ down).

### Device identity

- Cookie name: `mafi_device`
- Value: anonymous UUID, set on first visit if absent.
- Auth for reactions: cookie only in this phase (no account required).

### Cookie attributes (binding for implementation)

| Attribute | Value |
|-----------|--------|
| Name | `mafi_device` |
| HttpOnly | **true** |
| Secure | **true** when the site is served over HTTPS; may be false on local HTTP preview only |
| SameSite | `Lax` |
| Path | `/` |
| Lifetime | 400 days (renewed on successful reaction write, or on first set) |
| Value | UUID v4 (or equivalent opaque id); never PII |

### Storage model

- Store reactions keyed by `(deviceId, itemId)`.
- Aggregate counts / weight inputs per `sourceId` **for that device only**.
- Schema reserves a future nullable `userId` column (or equivalent) for login merge; merge logic is out of scope for this phase.
- Do **not** delete DB rows when a vote is cleared; clear/update the reaction state instead (`vote = null` or equivalent).

---

## §2 Weighting (v1: reading preference only)

### Binding Phase-1 decision — collect-frequency reduction OUT OF SCOPE

Existing collect scheduler (`packages/backend/src/sources/collect.ts` ≈ `scheduleDueSources` ~line 483) uses **one global cadence** per source (`interval_minutes` / `next_fetch_at`), plus daily `adaptIntervals`. There is no per-device collect loop.

**Conflict if collect were tied to device weight:** phone up / desktop down → which device should collect listen to?

**v1 binding decision:** ship **reading preference only** (rank / presentation order for that device’s views). **Collect-frequency reduction is OUT OF SCOPE for v1.**

A separate follow-up must define before any collect stretch ships:

1. Authorization subject (which device, or logged-in user, owns interval changes).
2. Cross-device conflict rules when preferences disagree.
3. Max stretched interval (and floor vs never-stop-collect).
4. Interaction with daily auto cadence tuning (`adaptIntervals`).

~~Former option C (stretch collect interval from `sourceWeight`)~~ is **deferred**. It must not appear as a v1 requirement, success criterion, or API read-path duty.

### Article weight (exact numbers)

For each article and the viewing device:

| Device vote on article | `articleWeight` |
|------------------------|-----------------|
| down | **0.15** (strong demote) |
| up | **1.25** (mild boost) |
| none / no row | **1.0** |

### Source weight (unchanged formula; view-only)

For each device’s view path:

```
sourceWeight = clamp(1 + 0.15 * ups − 0.25 * downs, 0.3, 1.8)
```

- `ups` / `downs` = counts of that device’s article votes on items belonging to the source.
- Sources with no votes for that device: `sourceWeight = 1`.
- Applied **only** to per-device sort / presentation order — **never** to global scores, global `selected` rows, collect intervals, or reports.

### Combined sort key

For every surface below, start from the **already-fetched / already-eligible public candidate set** for that route (same pool the unauthenticated public path would use). Floor remains `LISTING_FLOOR_BEIJING_DATE = 2026-10-23`. Votes **never expand or shrink** the public collect set or the public eligible set in v1.

Define:

```
prefFactor(item) = articleWeight(item) × sourceWeight(item.sourceId)
finalSortKey(item) = publicBaseScore(item) × prefFactor(item)
```

- `publicBaseScore` = the existing public ranking / time / seat score the route already uses **before** preference (unchanged globally).
- Higher `finalSortKey` sorts earlier when the surface is score-ordered.
- When the surface is primarily time-ordered (动态), preference reorders **within the defined window** as specified below; it does not invent a new global score column.

Stable tie-break (all surfaces): higher `finalSortKey`, then newer public time field, then `itemId` ascending.

---

## §3 Per-surface sort rules (executable)

### Candidate scope (all surfaces)

Preference applies **only within** the already-fetched / already-eligible public set for that route. Votes do not add items, remove items from the public DB, or change who is globally `selected`.

### 动态 (timeline)

- Public path today is **time-paginated** (cursor + limit; public cache).
- **Where preference applies:** after loading the public page window (the items that the public cursor/limit would return for that request’s filters), **reorder that window** by `finalSortKey` (with time as the public base when score is time-derived). Do **not** pull the entire history into memory for a full-history reorder in v1.
- **Pagination after a vote (binding):**
  1. Client treats a successful `POST /api/site/reactions` as invalidating the current timeline session.
  2. Client **resets cursor to null** and refetches page 1 (same filters).
  3. Server does not guarantee cursor stability across preference changes; continuing an old cursor after a vote may skip or duplicate — hence the reset is mandatory on the client after any vote that affects 动态.
- Unvoted devices: response order matches today’s public timeline (no reorder).

### 精选 / 热点

- These surfaces involve **event grouping** in the public product.
- **v1 seat language redefined:** “精选 seating” / presentation order means **per-device presentation order over the same public candidate pool** (or the same public 精选/热点 payload’s items/groups). It does **not** mean writing new global `selected` rows from votes, and does **not** mutate site-wide shared seat records.
- **Event-group demotion (binding):** downvoting **one report/item demotes that item only** via `articleWeight`. Other items in the same event group keep their own article weights. The group’s display order among groups uses each group’s best (max) `finalSortKey` among its visible members (or the group’s existing public group score × the max `prefFactor` of members — equivalent intent: one downvote does not collapse the whole event). Source weight still applies per item via its source.
- Hot strip / 热点: same rules on the public hot candidate set for that response.

---

## §4 Public isolation (binding)

Current list API (`apps/api/src/routes/site.ts` ≈ timeline ~line 80) uses **public** cache (`cacheControl: public…`, edge-friendly). 精选 seats are site-wide shared records.

**Must hold for v1:**

1. Personal ranking / reordering affects **only the device’s view**.
2. Do **not** mutate: global scores, global `selected` seats, daily reports, or public unauthenticated API payloads.
3. Responses that include `myVote`, and any SSR that is device-specific, **must not share** the public edge/API cache key with the anonymous public response.
4. Device Cookie must be **forwarded correctly** on those personalized requests (browser → web/SSR → API as designed); missing cookie → public behavior, no `myVote`.
5. Cache policy for personalized responses: `Cache-Control: private, no-store` (or equivalent private + no shared CDN cache). Public routes without cookie stay on today’s public caching.

---

## §5 API, security & rollout

### Write API

- `POST /api/site/reactions`
- Body: `{ itemId, vote: "up" | "down" | null }`
- Auth: `mafi_device` cookie. If absent on a same-origin POST, **set the cookie then accept** the write (set-on-first-write). Cross-origin without cookie: reject (see Security).
- Response: current item `myVote` + that device’s source aggregate for the item’s source.

### Security (binding)

| Control | Rule |
|---------|------|
| Same-origin | Reject cross-site POSTs: require same-site / CSRF-safe pattern (SameSite=Lax cookie + reject mismatched `Origin`/`Sec-Fetch-Site` when `Origin` present; do not rely on CORS alone for cookie auth). |
| Rate limit | Per `deviceId` (fallback per IP if no cookie): e.g. **60 POSTs / minute**, burst 10; return 429 with problem+json. |
| Vote-eligible articles | Only items that exist in the public site item space for listing/detail (same id space as `/api/site/items/:id`); reject unknown / non-listable ids with 404. Floor date does not block voting on an eligible visible item. |
| Input | `itemId` same charset/length guard as item routes; `vote` enum only. |

### Read path

- List and detail APIs include `myVote` when the cookie is present (**private cache**; see §4).
- Timeline, 精选 presentation order, and hot feeds apply §2–§3 weights **in the device view only**.
- Collect scheduler is **unchanged** in v1 (no sourceWeight → interval stretch).

### Rollout notes

- Rebuild web after UI changes.
- Apply and verify on AIPC preview.
- Local commit only; **no push**.
- Login / cross-device merge: out of scope.
- Collect downshift: out of scope (follow-up).

---

## Out of scope (v1)

- Account login and cross-device sync until login
- **Collect-frequency reduction / interval stretch from votes** (deferred; see §2)
- Mutating global scores, global `selected` rows, daily reports, or public cache payloads
- Changing `LISTING_FLOOR_BEIJING_DATE`
- Expanding or shrinking the public collect / eligible set via votes
- Implementing the feature in the commit that only revises this spec

---

## Acceptance / success criteria

### Product / UX

1. Thumbs visible on feed cards and article content page (black-gold, next to bookmark star).
2. Votes persist across refresh for the same browser (`mafi_device` cookie with attributes in §1).
3. Feeds reorder using device prefs per §2–§3 (down demote / up mild boost / unvoted unchanged).
4. Unvoted path matches today’s public behavior.
5. No DB row deletion for preference clears; schema ready for future `userId` merge.
6. Collect intervals and global seats/scores/reports unchanged by voting.

### API / security acceptance cases

| Case | Expected |
|------|----------|
| Duplicate POST same `{itemId, vote}` | Idempotent; stored state unchanged; 200 with same `myVote` |
| Revoke (`vote: null`) after up/down | `myVote` none; weights recompute as unvoted for that article; row retained |
| Concurrent updates (two POSTs racing up vs down) | Last writer wins at DB; final `myVote` matches last committed write; no crash / no dual active votes |
| Cross-origin POST | Rejected (4xx); no vote written |
| Over rate limit | 429; no further writes until window |
| Unknown `itemId` | 404; no row created |
| Personalized list with cookie | Includes `myVote`; `Cache-Control` private / not shared with public |
| Same list without cookie | No `myVote`; public cache behavior unchanged |
| After vote on 动态 | Client resets cursor and refetches; no reliance on old cursor |

---

## Self-review checklist

- No TBD / TODO left in this document.
- Approach B kept (device cookie + server storage); UI placement and black-gold kept.
- **No contradiction:** v1 never mutates global 精选 seats; “seating” means per-device presentation order only.
- Collect stretch clearly **deferred**, not a v1 requirement.
- Public isolation, sort definitions (article × source, 动态 pagination reset, event-group = item-only demote), cookie/security/acceptance all present and binding.
- Success criteria are testable on AIPC preview after a future implementation plan — **implementation not started by this revision**.
