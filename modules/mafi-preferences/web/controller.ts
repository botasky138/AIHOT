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
