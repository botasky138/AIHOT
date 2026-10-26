# MAFi MODEL-on 本机试跑（2026-10-23 Asia/Tokyo）

目标：开启真实模型路径做精选/分析；本机可用 `scripts/mafi-auto-loop.mjs` 做定时采集+精选（**不是** apps/worker 常驻队列）。jina 等付费抓取预算保持 0；llm/deepseek 熔断 **20/450/500**。

## 当前状态（本轮已完成）

| 项 | 值 |
|---|---|
| Web | http://127.0.0.1:3000 |
| API | http://127.0.0.1:3001 / health `{"ok":true,"db":"ok"}` |
| DB | `mafi_preview_20261021` @ `127.0.0.1:55432` |
| `.env` | `MODEL_CALLS_ENABLED=true`，`COLLECT_ENABLED=true`；Feishu/IndexNow 仍 false |
| 预览启动 | `node scripts/start-mafi-preview.mjs`（现从 `.env` 读 MODEL；spawn 写入 `.data/preview-pids.json`） |
| 读者栈 | http://127.0.0.1:3030 （独立库，本轮未动） |
| 预算 | llm/deepseek **20/450/500**；embedding 5/30/50；jina 等 **0**（未改） |
| 今日预览库 llm 回执 | 连通/冒烟约 **1** + 单篇分析约 **5** ≈ **6** 次（日上限 500） |

### 已冒烟

1. `.data/smoke-model-once.mjs` — 1 次 DeepSeek JSON 连通，`status=passed`
2. `.data/smoke-analyze-one.mjs bl0pc81os8t33am1jmp0mjajm` — 单篇 `analyzeArticle`+publish，`relevance=pass`，`selected=false`（分 58 / 门槛 60），约 5 次请求

结果文件：`.data/smoke-model-once-result.json`、`.data/smoke-analyze-one-result.json`（本地，gitignore）。

## 关闭 MODEL

```powershell
cd <repo>
# 1) .env 改回
(Get-Content .env) -replace '^MODEL_CALLS_ENABLED=true$','MODEL_CALLS_ENABLED=false' | Set-Content .env -Encoding utf8
# 2) 停预览子进程（见 .data/preview-pids.json 的 children + 父 pid），再重启：
node scripts/start-mafi-preview.mjs
# 确认 preview-pids.json 里 MODEL_CALLS_ENABLED=false / models=false
```

或只停 API/Web：结束 `preview-pids.json` 中的 pid/children，不重启则 MODEL 仅对新进程生效。

## 全量模型精选（勿盲跑）

96 篇均在 `processing_state=new`。完整路径是 **worker** 的 `content.sweep` → analyze 队列：

```powershell
# 估算：约 5–8 次 llm/篇 × 96 ≈ 480–770 > 日上限 500。不要一次开全量。
$env:DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:5432/YOUR_PREVIEW_DB'
# 在已 MODEL=true 的同一 env 下小批手动：
node .data/smoke-analyze-one.mjs <articleId>   # 仅 1 篇
# 或启动 worker（会扫未处理稿，注意预算）：
# npm run dev:worker -w @aihot/worker
# 建议先把 budgets.per_day 保持 150，并用 SQL/后台只放行少量 article，或一次只 analyze 少量 id。
```

带正文的候选可先：

```sql
SELECT id, source_id, left(title,60), length(coalesce(body_text,'')) AS body_len
FROM articles WHERE body_status='ok' AND processing_state='new' ORDER BY published_at DESC;
```

`body_status=pending` 的需先 extract（可能触发采集路径）；本机 NMPA 列表有 curl 回退，详情全文策略见 launch-acceptance。

## 备注

- `scripts/collect-mafi-preview.mjs` / `collect-mafi-auto.mjs`：**可在 MODEL=true 时运行**；采集子进程强制 `MODEL_CALLS_ENABLED=false`，不调用 LLM。
- 首页现有条目多为 `collect-preview` 种子 publications，不是模型精选；模型入选后会走正常 publish。
- **不要 commit `.env`**。

## 本机自动采集 + 精选（2026-10-23）

本地 forever 调度（不依赖聊天会话；preview 栈可独立运行）：

| 项 | 值 |
|---|---|
| 启动 | `node --env-file=.env scripts/start-mafi-auto.mjs` |
| 停止 | `node scripts/stop-mafi-auto.mjs` |
| 一次性验证 | `node --env-file=.env scripts/start-mafi-auto.mjs --once`（或 `--fg --once`） |
| 采集间隔 | **10 分钟**（`scripts/collect-mafi-auto.mjs`） |
| 精选/分析间隔 | **60 分钟**（`scripts/analyze-mafi-auto.mjs`） |
| 每 tick 上限 | 最多 **12** 篇 analyze；约 **80** llm 请求；最多 **12** 篇免费 extract（`paidFallback:false`，不碰 jina）；仍低于小时熔断 450 |
| 预算行为 | 读 live `budgets`；默认 dayStop=per_day-5、hourStop=per_hour-10；触顶或 `BudgetExceededError` 本 tick 干净停止 |
| 日志 | `.data/logs/auto-loop-YYYY-MM-DD.log`、`collect-*.log`、`analyze-*.log`、`analyze-last.json` |
| pid | 写入 `.data/preview-pids.json` → `autoLoop` |

MODEL 保持 `.env` 的 true；采集路径忽略栈上 MODEL，子进程关 MODEL。不要用本循环一次扫完全部历史稿。

首页/列表读 DB，无前端 realtime；采集或精选写入后 **刷新页面** 即可看到新内容。
