# MAFi 本机可上线验收（launch-acceptance）

更新时间：2026-10-22（Asia/Tokyo）。范围：**本机试运行**，不是公网/CDN 部署。`MODEL_CALLS_ENABLED` 保持 **false**；未 push。

独立库：`mafi_preview_20261021` @ `127.0.0.1:55432`（容器 `mafi-postgres-test-20261021`）。  
读者栈（AA/Tibo）是另一套：`http://127.0.0.1:3030` / 库 `mafi_readers_preview_20261022`，与主站 `:3000` 分离。

---

## 验收条目标记

| # | 项 | 状态 | 证据 |
|---|---|---|---|
| A | 12 个医药/金融源采集成功；NMPA 412 已排查并修复（无付费 jina） | **done** | 见下 A |
| B | 主站预览 `http://127.0.0.1:3000` 能展示采集内容（COLLECT true / MODEL false，仅回环） | **done（带说明）** | 见下 B |
| C | 管理员登录使用轮换后的 `ADMIN_PASSWORD`（密码文件路径，不写出口令） | **done** | 见下 C |
| D | 本清单 + handoff 进度；本地 commit、不 push | **done** | 本文件与 `mafi-handoff.md` |
| E | 采集-only 一次性配方（非常驻 daemon） | **done（可选）** | `scripts/collect-mafi-preview.mjs` |

---

## A) Collect path

### 结果（2026-10-22）

- 12/12 启用源健康为 ok；`articles` **96** 篇（每源 8 篇）。
- 源：`web-nmpa-devices`、`web-nmpa-trends`、`web-smpaa-notices`、`web-nhsa-news`、`web-nbs-releases`、`web-pboc-news`、`web-safe-news`、`web-csrc-market`、`web-shfe-notices`、`rss-fed-press`、`rss-cnbc-top`、`web-stcn-news`。
- 8 个 AI 补充源仍暂停（未改）。
- 付费通道 jina 预算仍为 0；NMPA 未走 jina。

### NMPA HTTP 412 结论与修复

| 探针 | 结果 |
|---|---|
| `curl.exe` + 默认/浏览器 UA → `ylqxggtg` / `ylqxjgdt` | HTTP **200** |
| Node `undici`（采集实际路径）+ 任意 UA/Referer/sec-ch / cookie 重试 | HTTP **412**（Aliyun WAF，`acw_tc` + JS challenge 体） |
| 备选列表 URL（`xxgk/...`、根栏目等） | 404 / 仍 412，无可用替代公开列表 |
| 付费 jina | **未使用**（预算 0） |

根因：站点对 **Node/undici TLS 指纹** 返回 412；与 User-Agent 字符串关系不大。  
修复：`packages/backend/src/sources/web-list.ts` 在 `nmpa.gov.cn` 且状态 412 时，对**列表页**回退到系统 `curl`（仍用站点 `DEFAULT_UA`）。详情页/全文路径未改；NMPA 源 `site_fulltext=false` 且无 `config.detail`。

重跑：

```powershell
$env:DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:5432/YOUR_PREVIEW_DB'
node --env-file=.env scripts/collect-mafi-preview.mjs web-nmpa-devices web-nmpa-trends
# 或全部 12 源：
node --env-file=.env scripts/collect-mafi-preview.mjs
```

核对：

```powershell
docker exec mafi-postgres-test-20261021 psql -U mafi -d mafi_preview_20261021 -c "SELECT source_id, count(*) FROM articles GROUP BY 1 ORDER BY 1;"
docker exec mafi-postgres-test-20261021 psql -U mafi -d mafi_preview_20261021 -c "SELECT id, health, last_error FROM sources WHERE id LIKE '%nmpa%';"
```

日志：`.data/collect-only-20261022.log`、`.data/nmpa-recollect.log`。

---

## B) 主站预览 localhost:3000

### 栈说明

| 栈 | URL | 库 | 用途 |
|---|---|---|---|
| 主站预览 | `http://127.0.0.1:3000`（API `3001`） | `mafi_preview_20261021` | 资讯首页 /admin |
| 读者预览 | `http://127.0.0.1:3030`（API `3031`） | `mafi_readers_preview_20261022` | AA / Tibo；**不是**主站文章库 |

### 启动（COLLECT true / MODEL false，仅回环，读 `.env` 密钥）

```powershell
cd <repo>
# 推荐（已写入仓库）：
node scripts/start-mafi-preview.mjs
# 等价本地副本：
# node .data/start-preview.mjs
```

脚本要点：`DATABASE_URL`→`mafi_preview_20261021`；`API/WEB_HOST=127.0.0.1`；强制 `COLLECT_ENABLED=true`、`MODEL_CALLS_ENABLED=false`；从 `.env` 加载 `ADMIN_PASSWORD` / `SESSION_SECRET`（不再随机生成）。PID：`.data/preview-pids.json`。

### 首页为何需要 publications

采集只写入 `articles`。公开首页 / `/api/v1/items` 读的是 **`publications`**（精选/池）。`MODEL_CALLS_ENABLED=false` 时分析管线不跑，故本机验收用一次性桥接：

```powershell
node scripts/seed-collect-preview-publications.mjs
```

将已采集文章写成 `eligible+selected` 的 **collect-preview** 行（`reason` 含 `collect-preview`，**不是**模型精选）。正式精选仍需授权后开 MODEL。

核对：

```powershell
curl.exe -s http://127.0.0.1:3000/api/v1/items?mode=selected^&window=7d^&limit=5
# 浏览器打开 http://127.0.0.1:3000/ 应非空
```

本轮证据：HOME HTTP 200，正文长度约 120KB，API selected 返回 ≥5 条；含 NMPA/集采等关键词。

---

## C) Admin 登录

- 口令来源（**勿把口令写进报告/commit**）：`.data/backups/mafi-prelaunch-20261022/NEW-ADMIN-PASSWORD.txt`（正文一行口令；与当前 `.env` 的 `ADMIN_PASSWORD` 一致）。
- 验证（本机已通过）：
  - `GET /api/auth/options` → `{ password: true }`
  - `POST /api/auth/password`（form：`password` + `return=/admin`）→ **303** `/admin`，Set-Cookie `aihot_admin`
  - `GET /api/admin/me`（带 cookie）→ **200**，`dev:false`

浏览器：打开 `http://127.0.0.1:3000/admin/login`，用上述文件中的口令登录。

---

## D) 文档与提交

- 本文件：`docs/mafi-launch-acceptance.md`
- 进度同步：`docs/mafi-handoff.md`「本机可上线验收」节
- 约束：本地 commit；**禁止** `git push`；**禁止** 将 `MODEL_CALLS_ENABLED` 设为 true

---

## E) Collect-only 配方（可选）

不要默认拉起常驻 worker。监督下的一次性采集：

```powershell
node --env-file=.env scripts/collect-mafi-preview.mjs
```

若确需 worker，仅在可监督终端前台运行（示例，**勿**设 MODEL true）：

```powershell
$env:DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:5432/YOUR_PREVIEW_DB'
$env:COLLECT_ENABLED='true'
$env:MODEL_CALLS_ENABLED='false'
# 仅在明确知道 worker 入口时前台启动，Ctrl+C 可停；本轮未拉起常驻进程
```

本轮**未**启动常驻 worker daemon。

---

## 剩余阻断 / 未做

1. **模型精选 / 留出评测**：需花费授权后才能真正跑 analyze→publish；当前首页条目为 collect-preview 占位。
2. **公网部署 / CDN / 域名**：明确 out of scope。
3. **NMPA 详情/全文**：列表 curl 回退已够入库；若将来开全文，undici 仍可能 412，需另案（仍避免付费 jina 除非授权预算）。
4. **push 上游**：禁止。

---

## 快速回归命令

```powershell
# 采集计数
docker exec mafi-postgres-test-20261021 psql -U mafi -d mafi_preview_20261021 -c "SELECT count(*) FROM articles;"
# 预览存活
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/
curl.exe -s "http://127.0.0.1:3000/api/v1/items?mode=selected&window=7d&limit=3"
# 开关
Select-String -Path .env -Pattern "^COLLECT_ENABLED|^MODEL_CALLS_ENABLED"
```

