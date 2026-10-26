import { useEffect, useState } from "react";
import type { SiteStatus } from "@aihot/contracts/site";

/** Traffic-light *dot* only — panel chrome stays metal/neutral (no mint wash). */
const LIGHT_DOT: Record<SiteStatus["light"], string> = {
  green: "bg-ok",
  yellow: "bg-amber",
  red: "bg-hot",
};

const PANEL =
  "border-line bg-surface text-ink shadow-card dark:bg-surface-2";

function formatTokyo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(t));
}

/** Small traffic-light pill: polls /api/site/status (proxied). */
export function SiteStatusPill({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/site/status", {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as SiteStatus;
        if (!cancelled) {
          setStatus(body);
          setErr(false);
        }
      } catch {
        if (!cancelled) {
          setErr(true);
          setStatus(null);
        }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const light = err || !status ? "red" : status.light;
  const label = err || !status ? "服务异常" : status.label;
  const detail = err
    ? "无法读取站点状态"
    : status
      ? status.detail
      : "正在检查…";
  const refresh = status?.lastCollectAt ?? status?.newestArticleAt ?? null;
  const analyze = status?.lastAnalyzeAt ?? null;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-control border px-2.5 py-1.5 ${PANEL} ${className}`}
        title={detail}
        role="status"
        aria-live="polite"
      >
        <span className={`size-1.5 shrink-0 rounded-full ${LIGHT_DOT[light]}`} aria-hidden="true" />
        <span className="min-w-0 truncate text-[12px] font-medium text-ink">{label}</span>
        <span className="ml-auto shrink-0 text-[10px] text-ink-4">刷新 {formatTokyo(refresh)}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-control border px-2.5 py-2 ${PANEL} ${className}`}
      title={detail}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none text-ink">
        <span className={`size-1.5 shrink-0 rounded-full ${LIGHT_DOT[light]}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 space-y-0.5 text-[10px] leading-[1.35] text-ink-4">
        <div>内容刷新 {formatTokyo(refresh)}</div>
        <div>精选分析 {formatTokyo(analyze)}</div>
      </div>
    </div>
  );
}
