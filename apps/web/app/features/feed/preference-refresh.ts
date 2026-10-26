import type { TimelineResponse } from "@aihot/contracts/site";

/** After a preference vote, /all must drop page and keep other filters. */
export function allHrefAfterPreferenceChange(search: string): string {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(raw);
  sp.delete("page");
  const s = sp.toString();
  return s ? `/all?${s}` : "/all";
}

export function allPageNeedsNavigateToHead(search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const page = new URLSearchParams(raw).get("page");
  return !!page && page !== "1";
}

export interface TimelineListState {
  version: 2;
  cards: TimelineResponse["cards"];
  nextCursor: string | null;
  dayCounts: Record<string, number>;
  collapsed: string[];
  batches: number;
  unreadOnly: boolean;
}

/**
 * Refetch 精选 timeline head (caller supplies the no-cursor list path) with private
 * cache semantics so myVote on cards comes from the personalized API response.
 */
export async function fetchTimelineHeadState(
  headPath: string,
  opts: { signal?: AbortSignal; unreadOnly?: boolean } = {},
): Promise<TimelineListState> {
  const res = await fetch(headPath, {
    signal: opts.signal,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(String(res.status));
  const page = (await res.json()) as TimelineResponse;
  return {
    version: 2,
    cards: page.cards,
    nextCursor: page.nextCursor,
    dayCounts: page.dayCounts,
    collapsed: [],
    batches: 1,
    unreadOnly: opts.unreadOnly ?? false,
  };
}
