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
