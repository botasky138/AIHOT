#!/usr/bin/env node
/**
 * Stop MAFi auto loop recorded in .data/preview-pids.json.
 *
 *   node scripts/stop-mafi-auto.mjs
 */
import fs from "node:fs";
import path from "node:path";

const pidPath = path.join(process.cwd(), ".data", "preview-pids.json");
let cur = {};
try { cur = JSON.parse(fs.readFileSync(pidPath, "utf8")); } catch {
  console.error("no preview-pids.json");
  process.exit(1);
}
const pid = cur.autoLoop?.pid;
if (!pid) {
  console.log(JSON.stringify({ ok: true, message: "no autoLoop pid recorded" }));
  process.exit(0);
}
let killed = false;
let aliveBefore = false;
try {
  process.kill(pid, 0);
  aliveBefore = true;
} catch {}
if (aliveBefore) {
  try {
    process.kill(pid, "SIGTERM");
    killed = true;
  } catch (e) {
    // Windows may need taskkill
    try {
      const { spawnSync } = await import("node:child_process");
      const r = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
      killed = (r.status === 0);
      if (!killed) console.error(r.stderr || r.stdout);
    } catch (e2) {
      console.error(String(e2?.message ?? e2));
    }
  }
}
cur.autoLoop = {
  ...cur.autoLoop,
  stoppedAt: new Date().toISOString(),
  stopRequested: true,
  killed,
  aliveBefore,
};
fs.writeFileSync(pidPath, JSON.stringify(cur, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, pid, aliveBefore, killed }));
