import { isIP } from "node:net";
import type { AaData, AaModel, CodexActivity, CodexContextPost, CodexData, CodexEvent, CodexPost } from "../contracts.ts";

function invalid(): never { throw new Error("Unsupported reader response schema"); }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
export function text(value: unknown): string {
  if (typeof value !== "string" || value.length > 100_000 || value.includes("\0")) return invalid();
  return value;
}
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
export function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return invalid();
  return value;
}
export function integer(value: unknown, min = 0): number {
  const n = number(value);
  return Number.isSafeInteger(n) && n >= min ? n : invalid();
}
function bool(value: unknown): boolean { return typeof value === "boolean" ? value : invalid(); }
export function array(value: unknown, max = 1000): unknown[] {
  return Array.isArray(value) && value.length <= max ? value : invalid();
}
function choice<const T extends string>(value: unknown, choices: readonly T[]): T {
  return typeof value === "string" && choices.includes(value as T) ? value as T : invalid();
}
export function timestamp(value: unknown): string {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s)) ? s : invalid();
}
function nullableTime(value: unknown): string | null { return value == null ? null : timestamp(value); }
function date(value: unknown): string { const s = text(value); return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) ? s : invalid(); }
/** Link validation never fetches a link found in upstream content. */
export function safeUrl(value: unknown): string {
  const s = text(value);
  if (s.length > 4096 || /[\s\u0000-\u001f\u007f\\]/.test(s)) return invalid();
  let u: URL;
  try { u = new URL(s); } catch { return invalid(); }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password || !host.includes(".") || isIP(host) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)) return invalid();
  return s;
}
function context(value: unknown): CodexContextPost {
  const x = object(value);
  return { id: text(x.id), author: text(x.author), relation: choice(x.relation, ["reply", "quote"]), text: nullableText(x.text), originalText: text(x.originalText), url: safeUrl(x.url) };
}
function post(value: unknown): CodexPost {
  const x = object(value);
  return { id: text(x.id), publishedAt: timestamp(x.publishedAt), stage: text(x.stage), text: text(x.text), originalText: text(x.originalText), fullText: nullableText(x.fullText), fullOriginalText: nullableText(x.fullOriginalText), context: x.context == null ? [] : array(x.context, 100).map(context), url: safeUrl(x.url) };
}
function event(value: unknown): CodexEvent {
  const x = object(value);
  const p = x.presentation == null ? null : object(x.presentation);
  const s = x.schedule == null ? null : object(x.schedule);
  const e = x.estimate == null ? null : object(x.estimate);
  return {
    id: text(x.id), type: choice(x.type, ["direct_reset", "reset_credit"]), displayLabel: text(x.displayLabel),
    presentation: p ? { status: choice(p.status, ["announced", "in_progress", "confirmed", "expired_unconfirmed", "likely_completed"]), scopeKnown: bool(p.scopeKnown), scopeLabel: nullableText(p.scopeLabel), kindExplicit: bool(p.kindExplicit), timeInferred: bool(p.timeInferred), audienceZh: nullableText(p.audienceZh), productsZh: nullableText(p.productsZh), reportedAt: nullableTime(p.reportedAt) } : null,
    status: choice(x.status, ["announced", "confirmed"]), title: text(x.title), createdAt: timestamp(x.createdAt), updatedAt: timestamp(x.updatedAt),
    confirmedAt: nullableTime(x.confirmedAt), occurredOn: x.occurredOn == null ? null : date(x.occurredOn),
    confirmationBasis: x.confirmationBasis == null ? null : choice(x.confirmationBasis, ["source_post", "receipt_review"]),
    schedule: s ? { precision: choice(s.precision, ["exact", "approximate", "deadline", "date", "window"]), from: timestamp(s.from), through: timestamp(s.through), label: text(s.label) } : null,
    estimate: e ? { from: timestamp(e.from), through: timestamp(e.through), basis: choice(e.basis, ["model", "source", "source_day", "history"]), label: text(e.label), reason: text(e.reason) } : null,
    posts: array(x.posts, 100).map(post), url: safeUrl(x.url),
  };
}
function activity(value: unknown): CodexActivity {
  const x = object(value);
  return { id: text(x.id), publishedAt: timestamp(x.publishedAt), eventIds: array(x.eventIds, 100).map(text), kind: choice(x.kind, ["event_update", "related"]), text: nullableText(x.text), originalText: text(x.originalText), context: array(x.context, 100).map(context), statusChanged: bool(x.statusChanged), action: x.action == null ? null : choice(x.action, ["announce", "confirm", "amend", "withdraw"]), url: safeUrl(x.url) };
}
export function parseCodex(value: unknown, stored = false): CodexData {
  const x = object(value);
  if ((!stored && x.schemaVersion !== 1) || x.timezone !== "Asia/Shanghai") return invalid();
  const m = x.monitor == null ? null : object(x.monitor);
  const o = x.outage == null ? null : object(x.outage);
  return {
    timezone: "Asia/Shanghai", today: x.today == null ? null : date(x.today), checkedAt: nullableTime(x.checkedAt), historyFrom: timestamp(x.historyFrom),
    events: array(x.events, 300).map(event), activities: x.activities == null ? [] : array(x.activities, 1000).map(activity),
    monitor: m ? { status: choice(m.status, ["healthy", "delayed", "attention", "unknown"]), lastAttemptAt: nullableTime(m.lastAttemptAt), lastCollectedAt: nullableTime(m.lastCollectedAt), lastVerifiedAt: nullableTime(m.lastVerifiedAt), heldWindowCount: integer(m.heldWindowCount), pendingCount: integer(m.pendingCount), reviewCount: integer(m.reviewCount) } : null,
    outage: o ? { postId: text(o.postId), publishedAt: timestamp(o.publishedAt), text: nullableText(o.text), originalText: text(o.originalText), recoveredAt: nullableTime(o.recoveredAt), resetEventId: nullableText(o.resetEventId), url: safeUrl(o.url) } : null,
  };
}
export function recentCodex(data: CodexData, _now: number): CodexData {
  // /recent owns its Beijing-day window (historyFrom) and also includes older pending events.
  // Cache freshness belongs to the envelope; elapsed local time cannot retract source facts.
  return data;
}

const EVALUATIONS = ["artificial_analysis_intelligence_index", "artificial_analysis_coding_index", "artificial_analysis_agentic_index", "artificial_analysis_finance_and_accounting_index", "artificial_analysis_strategy_and_ops_index", "artificial_analysis_legal_index", "artificial_analysis_healthcare_and_medical_index", "artificial_analysis_engineering_index", "artificial_analysis_economics_index"];
const PRICING = ["price_1m_input_tokens", "price_1m_output_tokens"];
const PERFORMANCE = ["median_output_tokens_per_second", "median_time_to_first_token_seconds", "median_time_to_first_answer_token_seconds", "median_end_to_end_response_time_seconds"];
function metrics(value: unknown, required: string[]): Record<string, number | null> {
  const x = object(value);
  if (Object.keys(x).length > 100 || required.some((k) => !(k in x))) return invalid();
  return Object.fromEntries(Object.entries(x).map(([k, v]) => {
    if (!/^[a-z][a-z0-9_]{0,100}$/.test(k)) return invalid();
    return [k, v === null ? null : number(v)];
  }));
}
function aaModel(value: unknown): AaModel {
  const x = object(value), c = object(x.model_creator);
  return { id: text(x.id), name: text(x.name), slug: text(x.slug), release_date: x.release_date === null ? null : date(x.release_date), model_creator: { id: text(c.id), name: text(c.name), ...(c.slug == null ? {} : { slug: text(c.slug) }) }, evaluations: metrics(x.evaluations, EVALUATIONS), pricing: metrics(x.pricing, PRICING), performance: metrics(x.performance, PERFORMANCE) };
}
export function parseAaPage(value: unknown) {
  const x = object(value), p = object(x.pagination);
  const tier = choice(x.tier, ["free", "pro", "commercial"]);
  const version = number(x.intelligence_index_version);
  if (version <= 0) return invalid();
  const page = integer(p.page, 1), pageSize = integer(p.page_size, 1), totalPages = integer(p.total_pages, 1), hasMore = bool(p.has_more);
  const models = array(x.data, 1000).map(aaModel);
  if (models.length > pageSize || page > totalPages || hasMore !== (page < totalPages)) return invalid();
  return { tier, version, page, pageSize, totalPages, hasMore, models };
}
export function parseAaStored(value: unknown): AaData {
  const x = object(value);
  const version = number(x.intelligence_index_version);
  if (version <= 0) return invalid();
  const models = array(x.models, 12_000).map(aaModel), pages = integer(x.pages, 1);
  if (pages > 12 || new Set(models.map((m) => m.id)).size !== models.length) return invalid();
  return { tier: choice(x.tier, ["free", "pro", "commercial"]), intelligence_index_version: version, models, pages };
}
