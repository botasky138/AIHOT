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
