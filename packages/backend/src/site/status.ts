// Cheap site/runtime health for the preview chrome. No LLM: DB ping + pid file + log/report mtimes.
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { SiteStatus, SiteStatusLight } from "@aihot/contracts/site";
import { REPO_ROOT } from "../config.ts";
import { sql } from "../db.ts";

const COLLECT_OK_MS = 15 * 60_000;
const COLLECT_STALE_MS = 35 * 60_000;
const ANALYZE_STALE_MS = 90 * 60_000;

type PidAutoLoop = {
  pid?: number;
  startedAt?: string;
  updatedAt?: string;
  stoppedAt?: string;
  collectRuns?: number;
  analyzeRuns?: number;
  collectMs?: number;
  analyzeMs?: number;
};

type PidFile = {
  autoLoop?: PidAutoLoop;
};

function pidAlive(pid: number | undefined): boolean {
  if (!Number.isFinite(pid) || !pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(file: string): T | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function mtimeIso(file: string): string | null {
  try {
    if (!existsSync(file)) return null;
    return statSync(file).mtime.toISOString();
  } catch {
    return null;
  }
}

function tokyoDay(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

/** Scan the auto-loop log from the end for the latest collect/analyze tick stamps. */
function scanLoopLog(file: string): { lastCollectAt: string | null; lastAnalyzeAt: string | null; lastCollectExit: number | null } {
  let lastCollectAt: string | null = null;
  let lastAnalyzeAt: string | null = null;
  let lastCollectExit: number | null = null;
  try {
    if (!existsSync(file)) return { lastCollectAt, lastAnalyzeAt, lastCollectExit };
    const text = readFileSync(file, "utf8");
    const lines = text.length > 200_000 ? text.slice(-200_000).split(/\r?\n/) : text.split(/\r?\n/);
    for (const line of lines) {
      const mCollect = /^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+collect_tick_end\s+(\{.*\})\s*$/.exec(line);
      if (mCollect) {
        lastCollectAt = mCollect[1]!;
        try {
          const obj = JSON.parse(mCollect[2]!) as { exit?: number };
          lastCollectExit = typeof obj.exit === "number" ? obj.exit : null;
        } catch {
          lastCollectExit = null;
        }
      }
      const mAnalyze = /^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+analyze_tick_end\s+/.exec(line);
      if (mAnalyze) lastAnalyzeAt = mAnalyze[1]!;
    }
  } catch {
    /* ignore */
  }
  return { lastCollectAt, lastAnalyzeAt, lastCollectExit };
}

export async function loadSiteStatus(now = new Date()): Promise<SiteStatus> {
  const checkedAt = now.toISOString();
  let db: "ok" | "down" = "down";
  let newestArticleAt: string | null = null;
  try {
    const rows = await sql<{ newest: Date | null }[]>`SELECT max(created_at) AS newest FROM articles`;
    db = "ok";
    const newest = rows[0]?.newest;
    newestArticleAt = newest ? new Date(newest).toISOString() : null;
  } catch {
    db = "down";
  }

  const pidPath = path.join(REPO_ROOT, ".data", "preview-pids.json");
  const pids = readJson<PidFile>(pidPath);
  const loop = pids?.autoLoop;
  let autoLoop: SiteStatus["autoLoop"] = "missing";
  if (loop?.pid) autoLoop = pidAlive(loop.pid) && !loop.stoppedAt ? "running" : "dead";

  const loopLog = path.join(REPO_ROOT, ".data", "logs", `auto-loop-${tokyoDay(now)}.log`);
  const scanned = scanLoopLog(loopLog);
  const analyzeReport = readJson<{ checkedAt?: string; stoppedReason?: string; summary?: { selected?: number } }>(
    path.join(REPO_ROOT, ".data", "logs", "analyze-last.json"),
  );

  let lastCollectAt = scanned.lastCollectAt ?? loop?.updatedAt ?? mtimeIso(path.join(REPO_ROOT, ".data", "logs", `collect-${tokyoDay(now)}.log`));
  let lastAnalyzeAt = scanned.lastAnalyzeAt ?? analyzeReport?.checkedAt ?? null;

  let collect: SiteStatus["collect"] = "unknown";
  if (lastCollectAt) {
    const age = now.getTime() - Date.parse(lastCollectAt);
    if (scanned.lastCollectExit != null && scanned.lastCollectExit !== 0) collect = "failing";
    else if (Number.isFinite(age) && age <= COLLECT_OK_MS) collect = "ok";
    else if (Number.isFinite(age) && age <= COLLECT_STALE_MS) collect = "stale";
    else collect = "stale";
  }

  let analyze: SiteStatus["analyze"] = "unknown";
  const stop = analyzeReport?.stoppedReason ?? "";
  if (stop.startsWith("day_stop") || stop.startsWith("hour_stop") || stop.includes("budget")) {
    analyze = "budget_paused";
  } else if (lastAnalyzeAt) {
    const age = now.getTime() - Date.parse(lastAnalyzeAt);
    analyze = Number.isFinite(age) && age <= ANALYZE_STALE_MS ? "ok" : "stale";
  }

  let light: SiteStatusLight = "green";
  let label = "运行正常";
  let detail = "API 与数据库正常，自动循环在跑，近期采集成功";

  if (db === "down" || autoLoop === "dead" || collect === "failing") {
    light = "red";
    label = "服务异常";
    if (db === "down") detail = "数据库不可用";
    else if (autoLoop === "dead") detail = "自动循环未在运行";
    else detail = "采集连续失败";
  } else if (autoLoop === "missing" || collect === "stale" || analyze === "budget_paused" || analyze === "stale") {
    light = "yellow";
    // Distinct warn titles (must not reuse green's healthy copy / 数据获取中).
    if (analyze === "budget_paused") {
      label = "已达额度上限";
      detail = "模型日预算已触顶，精选分析暂停；采集仍在进行";
    } else if (collect === "stale") {
      label = "采集延迟";
      detail = "采集结果偏旧或延迟";
    } else if (autoLoop === "missing") {
      label = "需关注";
      detail = "未找到自动循环记录";
    } else {
      // analyze === "stale"
      label = "运行降级";
      detail = "分析偏旧，等待下一轮精选";
    }
  }

  return {
    light,
    label,
    detail,
    db,
    autoLoop,
    collect,
    analyze,
    lastCollectAt,
    lastAnalyzeAt,
    newestArticleAt,
    checkedAt,
  };
}
