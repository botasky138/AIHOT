#!/usr/bin/env node
/**
 * Start MAFi local auto loop (collect 10m / analyze 60m) in background.
 * Records pid into .data/preview-pids.json under autoLoop.
 *
 *   node --env-file=.env scripts/start-mafi-auto.mjs
 *   node --env-file=.env scripts/start-mafi-auto.mjs --once
 *   node --env-file=.env scripts/start-mafi-auto.mjs --fg
 *
 * Stop: node scripts/stop-mafi-auto.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const repo = process.cwd();
const once = process.argv.includes("--once");
const fg = process.argv.includes("--fg");
const pidPath = path.join(repo, ".data", "preview-pids.json");
const logDir = path.join(repo, ".data", "logs");
fs.mkdirSync(logDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const local = parseEnv(fs.readFileSync(path.join(repo, ".env"), "utf8"));
if (local.COLLECT_ENABLED !== "true") {
  console.error("COLLECT_ENABLED must be true in .env");
  process.exit(2);
}

let cur = {};
try { cur = JSON.parse(fs.readFileSync(pidPath, "utf8")); } catch {}
const oldPid = cur.autoLoop?.pid;
if (oldPid && !once) {
  try {
    process.kill(oldPid, 0);
    console.error(`autoLoop already running pid=${oldPid}; stop it first (node scripts/stop-mafi-auto.mjs)`);
    process.exit(2);
  } catch {
    // stale
  }
}

const args = ["--env-file-if-exists=.env", "scripts/mafi-auto-loop.mjs"];
if (once) args.push("--once");

const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
const outLog = path.join(logDir, `auto-launcher-${day}.log`);
const errLog = path.join(logDir, `auto-loop-${day}.err.log`);

// Mark starting so waiters do not accept a stale onceDone record.
cur.autoLoop = {
  ...(cur.autoLoop || {}),
  starting: true,
  startRequestedAt: new Date().toISOString(),
  once,
};
fs.writeFileSync(pidPath, JSON.stringify(cur, null, 2) + "\n");

if (fg) {
  const child = spawn(process.execPath, args, {
    cwd: repo,
    env: { ...process.env, ...local, COLLECT_ENABLED: "true" },
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  const out = fs.openSync(outLog, "a");
  const err = fs.openSync(errLog, "a");
  const child = spawn(process.execPath, args, {
    cwd: repo,
    env: { ...process.env, ...local, COLLECT_ENABLED: "true" },
    stdio: ["ignore", out, err],
    windowsHide: true,
    detached: true,
  });
  child.unref();

  let recorded = null;
  const deadline = Date.now() + (once ? 600000 : 30000);
  while (Date.now() < deadline) {
    try {
      const j = JSON.parse(fs.readFileSync(pidPath, "utf8"));
      const al = j.autoLoop;
      // Accept only the newly spawned pid (avoid stale --once record).
      if (al?.pid === child.pid) {
        recorded = al;
        if (!once || al.onceDone) break;
      }
    } catch {}
    await sleep(once ? 2000 : 300);
  }
  console.log(JSON.stringify({
    started: true,
    spawnPid: child.pid,
    autoLoop: recorded,
    loopLog: path.join(logDir, `auto-loop-${day}.log`),
    launcherLog: outLog,
    errLog,
    once,
    stop: "node scripts/stop-mafi-auto.mjs",
  }, null, 2));
  if (!recorded) process.exitCode = 1;
}
