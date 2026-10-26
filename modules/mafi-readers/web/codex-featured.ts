import type { CodexEvent } from "../contracts.ts";

/** Prefer active pending reset; otherwise newest confirmed/recent by time — never stick on stale likely_completed windows. */
export function pickFeaturedCodexEvent(events: readonly CodexEvent[] | undefined): CodexEvent | undefined {
  if (!events?.length) return undefined;
  const statusOf = (event: CodexEvent) => event.presentation?.status ?? event.status;
  const active = events.filter((event) => {
    const status = statusOf(event);
    return status === "announced" || status === "in_progress";
  });
  const pool = active.length ? active : [...events];
  return [...pool].sort((a, b) => {
    const ta = Date.parse(a.confirmedAt ?? a.createdAt);
    const tb = Date.parse(b.confirmedAt ?? b.createdAt);
    return tb - ta;
  })[0];
}
