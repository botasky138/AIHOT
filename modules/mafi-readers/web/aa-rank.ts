/** Pure AA leaderboard helpers - work only on fields present in the free/cached snapshot. */
import type { AaModel } from "../contracts.ts";

export type ReasoningKind = "reasoning" | "non_reasoning" | "unmarked";
export type AaSortKey = "intelligence" | "speed" | "latency" | "input_price" | "output_price" | "name" | "source";

export interface AaModelFilters {
  query?: string;
  /** Empty / omitted = all models (Clear = all). */
  modelIds?: readonly string[];
  /** @deprecated Prefer modelIds; kept for callers that still pass org names. Empty = all. */
  organizations?: readonly string[];
  /** Empty / omitted = all reasoning kinds. */
  reasoningKinds?: readonly ReasoningKind[];
}

export const ALL_REASONING_KINDS: readonly ReasoningKind[] = ["reasoning", "non_reasoning", "unmarked"];

/** localStorage key for /leaderboard filter prefs (model ids + related controls). */
export const AA_LEADERBOARD_STORAGE_KEY = "mafi-aa-leaderboard-prefs-v1";

export interface AaLeaderboardPrefs {
  modelIds: string[];
  reasoningKinds: ReasoningKind[];
  sort: AaSortKey;
  topN: number;
}

const SORT_KEYS = new Set<AaSortKey>(["intelligence", "speed", "latency", "input_price", "output_price", "name", "source"]);
const REASONING_SET = new Set<string>(ALL_REASONING_KINDS);
const TOP_N_ALLOWED = new Set([10, 15, 20, 30]);

/** Tokens that mark a trailing parenthesis as an effort / reasoning / fallback variant, not family identity. */
const VARIANT_TOKEN = /^(xhigh|high|medium|low|max|minimal|default|fallback|reasoning|non-reasoning|nonreasoning|based|on)$/i;

/** Epoch ms for AA `release_date` (YYYY-MM-DD). Missing/invalid → -Infinity so newest-first sorts push them last. */
export function releaseDateValue(date: string | null | undefined): number {
  if (typeof date !== "string" || !date.trim()) return Number.NEGATIVE_INFINITY;
  const raw = date.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z` : raw;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** Stable effort ordering when release_date ties (Xhigh → … → Minimal, then other labels). */
export function variantEffortRank(label: string): number {
  const match = label.toLowerCase().match(/\b(xhigh|max|high|medium|low|minimal)\b/);
  if (!match) return 50;
  const order: Record<string, number> = { xhigh: 0, max: 1, high: 2, medium: 3, low: 4, minimal: 5 };
  return order[match[1]] ?? 50;
}

export function intelligenceIndex(model: AaModel): number | null {
  const value = model.evaluations.artificial_analysis_intelligence_index;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** AA free payload has no structured reasoning flag; names often end with (Reasoning)/(Non-reasoning). */
export function reasoningKind(name: string): ReasoningKind {
  if (/\bnon[-\s]?reasoning\b/i.test(name)) return "non_reasoning";
  if (/\breasoning\b/i.test(name)) return "reasoning";
  return "unmarked";
}

/**
 * Split an AA model display name into family + variant label.
 * Peels trailing parentheses that encode thinking effort and/or Reasoning markers
 * (e.g. "(Xhigh, Default Fallback)", "(Non-reasoning, High)"). Keeps date/preview
 * parentheses on the family (e.g. "Gemini 2.5 Flash Preview (Sep '25)").
 */
export function splitAaModelName(name: string): { family: string; variantLabel: string | null } {
  let base = name.trim();
  const peeled: string[] = [];
  while (true) {
    const match = base.match(/^(.*)\(([^)]*)\)\s*$/);
    if (!match) break;
    const inner = match[2].trim();
    if (!inner) break;
    const parts = inner.split(/,\s*/).map((part) => part.trim()).filter(Boolean);
    const isVariantGroup = parts.length > 0 && parts.every((part) => {
      const tokens = part.split(/[\s/]+/).filter(Boolean);
      if (!tokens.length) return false;
      const allVariantish = tokens.every((token) => VARIANT_TOKEN.test(token) || /^gpt-oss/i.test(token) || /^\d/.test(token));
      return allVariantish;
    });
    const hasEffortOrReason = parts.some((part) =>
      part.split(/[\s/]+/).some((token) =>
        /^(xhigh|high|medium|low|max|minimal|reasoning|non-reasoning|nonreasoning)$/i.test(token),
      ),
    );
    if (!isVariantGroup || !hasEffortOrReason) break;
    peeled.unshift(inner);
    base = match[1].trim();
  }
  return { family: base || name.trim(), variantLabel: peeled.length ? peeled.join(" · ") : null };
}

export interface AaModelTreeLeaf {
  id: string;
  name: string;
  label: string;
  /** AA free snapshot `release_date` (YYYY-MM-DD) when present. */
  releaseDate: string | null;
}

export interface AaModelTreeFamily {
  key: string;
  name: string;
  leaves: AaModelTreeLeaf[];
}

export interface AaModelTreeOrg {
  key: string;
  name: string;
  families: AaModelTreeFamily[];
}

function compareLeavesNewestFirst(a: AaModelTreeLeaf, b: AaModelTreeLeaf): number {
  const byDate = releaseDateValue(b.releaseDate) - releaseDateValue(a.releaseDate);
  if (byDate) return byDate;
  const byEffort = variantEffortRank(a.label) - variantEffortRank(b.label);
  if (byEffort) return byEffort;
  return a.label.localeCompare(b.label, "en") || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id);
}

function familyNewestMs(leaves: readonly AaModelTreeLeaf[]): number {
  let best = Number.NEGATIVE_INFINITY;
  for (const leaf of leaves) {
    const value = releaseDateValue(leaf.releaseDate);
    if (value > best) best = value;
  }
  return best;
}

/** Org → family → leaf hierarchy. Orgs A–Z; families/leaves newest `release_date` first. */
export function buildAaModelTree(models: readonly AaModel[]): AaModelTreeOrg[] {
  const orgs = new Map<string, { name: string; families: Map<string, AaModelTreeLeaf[]> }>();
  for (const model of models) {
    const orgName = model.model_creator.name || "Unknown";
    const { family, variantLabel } = splitAaModelName(model.name);
    let org = orgs.get(orgName);
    if (!org) {
      org = { name: orgName, families: new Map() };
      orgs.set(orgName, org);
    }
    let leaves = org.families.get(family);
    if (!leaves) {
      leaves = [];
      org.families.set(family, leaves);
    }
    leaves.push({
      id: model.id,
      name: model.name,
      label: variantLabel ?? model.name,
      releaseDate: typeof model.release_date === "string" ? model.release_date : null,
    });
  }
  return [...orgs.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "en"))
    .map(([key, org]) => ({
      key,
      name: org.name,
      families: [...org.families.entries()]
        .map(([familyKey, leaves]) => ({
          key: familyKey,
          name: familyKey,
          leaves: [...leaves].sort(compareLeavesNewestFirst),
        }))
        .sort((a, b) => {
          const byDate = familyNewestMs(b.leaves) - familyNewestMs(a.leaves);
          if (byDate) return byDate;
          return a.name.localeCompare(b.name, "en");
        }),
    }));
}

/** Filter tree nodes by case-insensitive tokens against org, family, leaf label, and full name. */
export function filterAaModelTree(tree: readonly AaModelTreeOrg[], query: string): AaModelTreeOrg[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return tree as AaModelTreeOrg[];
  const matches = (haystack: string) => tokens.every((token) => haystack.includes(token));
  const out: AaModelTreeOrg[] = [];
  for (const org of tree) {
    const orgHay = org.name.toLowerCase();
    const orgHit = matches(orgHay);
    const families: AaModelTreeFamily[] = [];
    for (const family of org.families) {
      const familyHay = `${orgHay} ${family.name}`.toLowerCase();
      const familyHit = orgHit || matches(familyHay);
      const leaves = family.leaves.filter((leaf) => {
        if (familyHit) return true;
        return matches(`${familyHay} ${leaf.label} ${leaf.name} ${leaf.id}`.toLowerCase());
      });
      if (leaves.length) families.push({ ...family, leaves });
    }
    if (families.length) out.push({ ...org, families });
  }
  return out;
}

export function collectTreeModelIds(tree: readonly AaModelTreeOrg[]): string[] {
  const ids: string[] = [];
  for (const org of tree) {
    for (const family of org.families) {
      for (const leaf of family.leaves) ids.push(leaf.id);
    }
  }
  return ids;
}

/** Keep only ids still present in the current snapshot; empty → no active model filter (show all). */
export function sanitizeStoredModelIds(stored: readonly string[] | null | undefined, validIds: readonly string[]): string[] {
  if (!stored?.length) return [];
  const valid = new Set(validIds);
  return stored.filter((id) => typeof id === "string" && id.length > 0 && valid.has(id));
}

export function parseAaLeaderboardPrefs(raw: string | null | undefined): AaLeaderboardPrefs | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const value = JSON.parse(raw) as Partial<AaLeaderboardPrefs>;
    if (!value || typeof value !== "object") return null;
    const modelIds = Array.isArray(value.modelIds) ? value.modelIds.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
    const reasoningKinds = Array.isArray(value.reasoningKinds)
      ? value.reasoningKinds.filter((kind): kind is ReasoningKind => typeof kind === "string" && REASONING_SET.has(kind))
      : [];
    const sort = typeof value.sort === "string" && SORT_KEYS.has(value.sort as AaSortKey) ? value.sort as AaSortKey : "intelligence";
    const topN = typeof value.topN === "number" && TOP_N_ALLOWED.has(value.topN) ? value.topN : 15;
    return { modelIds, reasoningKinds, sort, topN };
  } catch {
    return null;
  }
}

export function serializeAaLeaderboardPrefs(prefs: AaLeaderboardPrefs): string {
  return JSON.stringify({
    modelIds: prefs.modelIds,
    reasoningKinds: prefs.reasoningKinds,
    sort: prefs.sort,
    topN: prefs.topN,
  });
}

export function organizationNames(models: readonly AaModel[]): string[] {
  return [...new Set(models.map((model) => model.model_creator.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "en"));
}

/** True when selection is empty or covers every known option (no active filter). */
export function isAllSelected(selected: readonly string[], options: readonly string[]): boolean {
  if (!selected.length) return true;
  if (selected.length < options.length) return false;
  const set = new Set(selected);
  return options.every((option) => set.has(option));
}

export function modelFilterLabel(selected: readonly string[], total: number): string {
  const n = selected.length;
  const m = Math.max(0, total);
  if (!n || (m > 0 && n >= m)) return `已选择 ${m}/${m} 个模型`;
  return `已选择 ${n}/${m} 个模型`;
}

export function organizationFilterLabel(selected: readonly string[], options: readonly string[]): string {
  if (isAllSelected(selected, options)) return "全部机构";
  return `已选 ${selected.length} 个机构`;
}

export function reasoningFilterLabel(selected: readonly ReasoningKind[]): string {
  if (isAllSelected(selected, ALL_REASONING_KINDS)) return "全部类型";
  if (selected.length === 1) {
    if (selected[0] === "reasoning") return "推理 (Reasoning)";
    if (selected[0] === "non_reasoning") return "非推理 (Non-reasoning)";
    return "名称未标注";
  }
  return `已选 ${selected.length} 种类型`;
}

export function filterAaModels(models: readonly AaModel[], filters: AaModelFilters = {}): AaModel[] {
  const tokens = (filters.query?.trim().toLowerCase() ?? "").split(/\s+/).filter(Boolean);
  const modelIds = filters.modelIds?.filter(Boolean) ?? [];
  const idActive = modelIds.length > 0;
  const idSet = idActive ? new Set(modelIds) : null;
  const organizations = filters.organizations?.filter(Boolean) ?? [];
  const orgActive = !idActive && organizations.length > 0;
  const orgSet = orgActive ? new Set(organizations) : null;
  const kinds = filters.reasoningKinds?.filter(Boolean) ?? [];
  const kindActive = kinds.length > 0 && !isAllSelected(kinds, ALL_REASONING_KINDS);
  const kindSet = kindActive ? new Set(kinds) : null;
  return models.filter((model) => {
    if (idSet && !idSet.has(model.id)) return false;
    if (orgSet && !orgSet.has(model.model_creator.name)) return false;
    if (kindSet && !kindSet.has(reasoningKind(model.name))) return false;
    if (!tokens.length) return true;
    const haystack = `${model.name} ${model.model_creator.name}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

function metric(model: AaModel, key: Exclude<AaSortKey, "name" | "source" | "intelligence">): number | null {
  if (key === "speed") {
    const value = model.performance.median_output_tokens_per_second;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  if (key === "latency") {
    const value = model.performance.median_time_to_first_token_seconds;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  if (key === "input_price") {
    const value = model.pricing.price_1m_input_tokens;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  const value = model.pricing.price_1m_output_tokens;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Higher is better for intelligence/speed; lower is better for latency and price. Nulls sink. */
export function sortAaModels(models: readonly AaModel[], sort: AaSortKey = "intelligence"): AaModel[] {
  if (sort === "source") return [...models];
  const copy = [...models];
  copy.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id);
    const left = sort === "intelligence" ? intelligenceIndex(a) : metric(a, sort);
    const right = sort === "intelligence" ? intelligenceIndex(b) : metric(b, sort);
    if (left == null && right == null) return a.name.localeCompare(b.name, "en");
    if (left == null) return 1;
    if (right == null) return -1;
    const ascending = sort === "latency" || sort === "input_price" || sort === "output_price";
    const delta = ascending ? left - right : right - left;
    return delta || a.name.localeCompare(b.name, "en");
  });
  return copy;
}

export interface RankedAaModel {
  model: AaModel;
  rank: number;
  score: number;
}

/** Top N by AA Intelligence Index among models that have a finite score. */
export function topByIntelligence(models: readonly AaModel[], limit = 15): RankedAaModel[] {
  const capped = Math.max(0, Math.min(50, Math.floor(limit)));
  return sortAaModels(models, "intelligence")
    .filter((model) => intelligenceIndex(model) != null)
    .slice(0, capped)
    .map((model, index) => ({ model, rank: index + 1, score: intelligenceIndex(model)! }));
}
