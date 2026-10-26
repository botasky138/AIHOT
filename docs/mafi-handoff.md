# MAFi 定制交付与待定事项

更新时间：2026-10-22（用户时区 Asia/Tokyo）。出刊排程仍为北京时间：日报 08:00、周一周报 10:00、每月 1 日月报 10:30。

## 已确认与已实现

- 站名 **MAFi**；药事所为**上海市医药集中招标采购事务管理所（上海医药采购中心）**，公开门户 [上海阳光医药采购网](https://www.smpaa.cn/)。
- 三条主线已按追加偏好设置：**器械全行业＋上海药政、医保与采购官方动态（手术室器械仍优先）、AI 模型/公司/GitHub 项目、国内外股票与黄金及宏观影响**。医药范围已按首批试标后的用户明确决定扩展，上海适用范围仍由原文确定，不因发布方所在地推断。首页、关于页、分享信息、MCP 前缀、图标和报告报头已适配。
- 12 个类别、36 个机构或公司主体、83 个主题。保留类别 key，markets 显示“股票”，derivatives 显示“黄金”，后者按本次关注范围纳入黄金现货/延期/期货/ETF；新增手术室器械细分与黄金主题、上金所主体词典，并同步标签白名单。新增主题不代表已接入新的采集或报价接口。
- 集采区分国家/联盟/省、批次、产品、采购阶段、公告日与执行日；金融保留统计期、修订、单位、币种、时区、合约和分析前提。模型宣传与独立证据分开，GitHub 热度与质量分开。
- 新增本站外部阅读模块及本地 workspace 登记，未升级第三方依赖；业务引擎、数据库迁移与模型调用代码未改。评分 7 种内容类型、五轴加权、噪声数字规则及 selection.ts 的入选门槛保持原样。

## Tibo 与 AA 外部数据

按用户追加要求，AIHOT 资讯页、资讯 API、全局顶部入口和接入说明已彻底移除，旧页面/API 返回 404；六份运行资讯缓存清理，原业务文章与历史标注保留。现在只保留 /codex-reset 与 /leaderboard，沿用框架样式，Tibo 的必要来源署名继续显示。AA key 已从误填的示例文件安全移入被 Git 忽略的 .env，示例恢复空值，密钥只装载到 API。通过官方免费接口 4 次 HTTP 200 取得 4 页、707 个模型，智能指数版本 4.3；预览重启及页面读取复用快照，配额仍为 4。外部数据不调用本站模型、不写业务文章或公开 v1/RSS/MCP。页面关闭后没有独立后台通知。详见[外部数据指南](mafi-readers.md)。

## 当前运行边界

当前已由用户选择**仅本人在本机试运行**，尚未部署到公网。前期各执行一次受限的合成 JSON 连通性请求；本次追加授权 DeepSeek Flash、最多 500 次，已对 66 条开发材料完成基线及一轮文字实验，实际累计 314 次。所有真实调用经过生产回执和预算，专用预算已归零；没有运行采集、正文写作、worker 或对外推送。新 .env.example 默认将 COLLECT_ENABLED、MODEL_CALLS_ENABLED 设为 false，FEISHU_*_ENABLED、INDEXNOW_SUBMIT_ENABLED 也保持 false，本机 .env 的常态开关也未改变。init-env.ts 从此模板生成配置；已有 .env 不会自动更新，必须自行核对。

用户已改选使用已有余额的 **DeepSeek 与 MiniMax API**，MiniMax 为国际开放平台 platform.minimax.io，不开通 Grok API。.env.example 默认 DeepSeek deepseek-flash，新增 MiniMax 国际地址与空密钥；site/models.ts 新增 minimax-m3 可选预设，初始所有步骤仍用 default，不启用自动故障切换。MiniMax-M3 关闭思考，不发送未获官方文档确认的 response_format，仍由现有 JSON 提取与 schema 校验拦截不可用输出。两者共用已有 llm 请求预算，继续走回执，未新增无限额预算服务或改变模型调用代码。每家一次的真实合成连通性检查已执行，具体结果及账号状态仅写入本机 .data/live-connectivity-report.md；不代表资讯评分、归组、写作质量或常态费用通过。自动处理的用量上限仍待配置，说明见 [启动指南](mafi-startup.md)。

当前种子默认启用 12 个医药/金融候选来源，八个原始 AI 补充源仍默认暂停，本次页面精简不自动开启付费模型或自采；这不表示后台已长期运行成功，也不覆盖已有库的同名来源。28 个候选均关闭站内全文和全文再分发，只展示摘要与原文链接。配置中的 enabled 不会越过全局开关。公开网页可访问不代表已取得全文或行情再分发许可。

这是新闻与政策观察站，当前不提供逐笔、盘中实时行情面板。证监会快报是周度统计，上期所配置入口是公告，CNBC/证券时报是报道；不可混称实时行情或自动预测系统。用户偏好授权实时、接受延时；上金所/上期所的官方行情入口与权限说明已写入启动指南，目前仅为外部阅读入口。

搜索用于发现线索并回到权威原文；现有采集仍为配置的官网列表/RSS/JSON，尚未集成定时全网搜索、Grok Web Search 或 X Search，站内搜索不能替代全网搜索。

## 信源证据与覆盖

前轮测试方法：只读下载公开网页/RSS/JSON，在本地快照服务器中调用仓库实际解析器。原 20 个来源（现含八个默认暂停 AI 补充源）均能生成文章候选，日期来自列表、官方文章 URL 的年月日或原文详情；证券时报列表只有时分，所以按详情页取完整日期。未调用模型，未把快照灌入生产业务库。后台持续抓取、附件正文质量、模型精选和真实日报生产仍未验证。

| 来源 | 默认状态 | 入口 | 本次证据/限制 |
|---|---|---|---|
| 国家药监局 · 医疗器械公告 | 默认候选（已验证解析） | https://www.nmpa.gov.cn/ylqx/ylqxggtg/index.html | 20 / 20 条有列表日期 |
| 国家药监局 · 医疗器械监管动态 | 默认候选（已验证解析） | https://www.nmpa.gov.cn/ylqx/ylqxjgdt/index.html | 20 / 20 条有列表日期 |
| 国家医保局 · 政策与工作动态 | 默认候选（已验证解析） | https://www.nhsa.gov.cn/ | 117 / 117 条有列表日期 |
| 上海阳光医药采购网 · 药事所公告 | 默认候选（已验证解析） | https://www.smpaa.cn/xxgk/gggs/index.shtml | 20 / 20 条有列表日期 |
| OpenAI News | 可选暂停（已验证解析） | https://openai.com/news/rss.xml | 1303 / 1303 条有列表日期 |
| Google DeepMind | 可选暂停（已验证解析） | https://deepmind.google/blog/rss.xml | 100 / 100 条有列表日期 |
| Anthropic News | 可选暂停（已验证解析） | https://www.anthropic.com/news | 24 / 24 条有列表日期 |
| DeepSeek API · 官方更新 | 可选暂停（已验证解析） | https://api-docs.deepseek.com/updates | 24 / 24 条有列表日期 |
| GitHub Blog · AI 与机器学习 | 可选暂停（已验证解析） | https://github.blog/ai-and-ml/feed/ | 10 / 10 条有列表日期 |
| GitHub Blog · 开源项目 | 可选暂停（已验证解析） | https://github.blog/open-source/feed/ | 10 / 10 条有列表日期 |
| GitHub · vLLM 正式版本 | 可选暂停（已验证解析） | https://api.github.com/repos/vllm-project/vllm/releases?per_page=10 | 10 / 10 条有列表日期 |
| GitHub · Ollama 正式版本 | 可选暂停（已验证解析） | https://api.github.com/repos/ollama/ollama/releases?per_page=10 | 10 / 10 条有列表日期 |
| 国家统计局 · 数据发布 | 默认候选（已验证解析） | https://www.stats.gov.cn/sj/zxfb/ | 15 / 15 条有列表日期 |
| 中国人民银行 · 新闻与政策 | 默认候选（已验证解析） | https://www.pbc.gov.cn/goutongjiaoliu/113456/113469/index.html | 15 / 15 条有列表日期 |
| 国家外汇管理局 · 外汇新闻 | 默认候选（已验证解析） | https://www.safe.gov.cn/safe/whxw/index.html | 20 / 20 条有列表日期 |
| 中国证监会 · 证券市场快报 | 默认候选（已验证解析） | https://www.csrc.gov.cn/csrc/c100119/common_list.shtml | 18 / 18 条有列表日期 |
| 上海期货交易所 · 公告通知 | 默认候选（已验证解析） | https://www.shfe.com.cn/publicnotice/notice/ | 20 / 20 条有列表日期 |
| 美联储 · 官方新闻稿 | 默认候选（已验证解析） | https://www.federalreserve.gov/feeds/press_all.xml | 20 / 20 条有列表日期 |
| CNBC · 国际财经与市场 | 默认候选（已验证解析） | https://www.cnbc.com/id/100003114/device/rss/rss.html | 30 / 30 条有列表日期 |
| 证券时报 · 财经要闻 | 默认候选（已验证解析） | https://www.stcn.com/article/list/yw.html | 0 / 10 条有列表日期；已另外验证详情日期 |
| Hugging Face Blog（本地连接待复核） | 暂停 | https://huggingface.co/blog/feed.xml | 本机 HTTPS 连接超时；RSS 地址保留，恢复后试采再启用。 |
| 美国劳工统计局（访问受限待复核） | 暂停 | https://www.bls.gov/feed/news_release/rss_latest.rss | 本次返回 HTTP 403；可另评估 BLS 官方数据 API 的指标范围与配额。 |
| 器审中心（待公开采集入口） | 暂停 | https://www.cmde.org.cn/ | 官网返回 HTTP 202/空壳，尚无经过试采的公开列表；不伪造 CSS 选择器。 |
| Qwen 官方动态（待公开采集入口） | 暂停 | https://qwen.ai/blog | 当前官网为动态空壳，未发现可用的公开静态列表；外部推送入口暂不接收内容。 |
| GitHub Trending（无发布日期，暂不入榜） | 暂停 | https://github.com/trending?since=daily | 榜单是观测热度，不是项目发布；缺少可靠发布日期，禁止拿抓取时间冒充。当前 GitHub 覆盖来自官方博客和 vLLM/Ollama Releases。 |
| 国家医保局 · 国家组织集采（内嵌列表待适配） | 暂停 | https://www.nhsa.gov.cn/col/col187/index.html | 该分类页的文章在 XML/CDATA 内，现有解析器无法直接读取；主页及上海药事所来源作为补充，不宣称覆盖全部栏目。 |
| 国家医保局 · 省际联盟采购（内嵌列表待适配） | 暂停 | https://www.nhsa.gov.cn/col/col185/index.html | 同上；省际联盟原始招采平台尚未逐省接入。 |
| 国家医保局 · 省级集中采购（内嵌列表待适配） | 暂停 | https://www.nhsa.gov.cn/col/col186/index.html | 同上；省级执行/接续采购覆盖仍需补齐。 |

医保局主页按文章 URL 的 /art/YYYY/M/D/ 读取发布日，并按时间排序；15 条协议相对/完整域名链接也已验证。Anthropic 同时解析带日期的模型卡片和新闻列表，涵盖 /claude-* 模型发布页，不只匹配 /news/。上海阳光采购网的置顶旧公告按日期归档，详情 h1 用于补全正式标题。

NHSA 对[国家药品联采机构职责的说明](https://www.nhsa.gov.cn/art/2026/6/23/art_187_21078.html)及上海市医保局的[事业单位页面](https://ybj.sh.gov.cn/ggsydwxxgk/20191114/0038-4534.html)支持药事所与门户的对应关系。

## 验证记录

2026-10-22 页面精简后最新验证：typecheck 与 Web 构建通过，npm test **952/952**（0 失败、0 跳过），原始 smoke **30/30**。旧资讯页面、query 页面及 API 返回 404；本轮移除与保留检查 **9/9**，AA/Tibo 页面与接口保留。真实 AA key 已验证：4 次请求、4 页、707 个模型，智能指数版本 4.3。预览重启及浏览器读取复用同一缓存，AA 请求计数仍为 4。桌面/手机已检查首页、Agent 资源、我的、AA 搜索与 Tibo 页面，未发现横向页面溢出，浏览器 0 错误/0 警告。完整额外浏览器套件仍因缺运行库未完成。详见本轮交付报告（本机材料，未上传）。

本机预览：[AA](http://127.0.0.1:3030/leaderboard)、[Tibo](http://127.0.0.1:3030/codex-reset)，独立库 mafi_readers_preview_20261022，API/Web 仅回环监听。AA key 只给 API；真实模型、采集、推送关闭，未启动 worker。旧 localhost:3000 预览保留。

### 前轮验证记录（历史）

2026-10-22 追加评测后的验证：原评分文案恢复后，Linux Node 24.22.0 上 typecheck、Web 构建通过，npm test **935/935**（0 失败、0 跳过，51.03 秒），smoke **30/30**。测试快照与当前源码/测试哈希匹配；只使用本地替身和隔离库，未复制真实 .env，验证库已清理。额外浏览器套件仍因缺少运行库未验证通过。详见本轮检查日志（本机材料，未上传）和开发评测报告（本机材料，未上传）。下表保留前轮定制验证记录。

| 检查 | 结果 | 证据与环境 |
|---|---|---|
| npm run typecheck | 通过，exit 0 | DeepSeek/MiniMax 及预设变量检查修复后，Linux Node 24.22.0 重新通过；上一轮 Windows Node 24.12.0 也通过 |
| npm test | **935 / 935 通过，0 失败、0 跳过，exit 0** | 本轮最新 site/industry/架构检查稳定快照，独立 PostgreSQL 17 mafi_linux_test；50.7 秒 |
| node scripts/smoke.ts | **30 / 30 通过，exit 0** | 真实本地 API + Web + 空预览库；15 页面、14 机器出口、MCP 初始化 |
| npm run build -w @aihot/web | 通过，exit 0 | 本轮 Windows 和 Linux 都重新完成 |
| 模型协议与预算 | **本地替身 2 / 2 通过** | 两家按预设发送请求、解析并校验 JSON；llm 预算为 0 时均在发送新请求前被拦截；没有真实 API 调用 |
| 预设变量架构检查 | 通过，含负向验证 | 认可模型预设实际读取的 baseUrlEnv/apiKeyEnv；临时未知项 MAFI_UNUSED_CONFIG_PROBE 仍被拒绝，恢复模板后全量测试通过 |
| 本机配置与端口 | 通过 | 最新模板配置生成 7 / 7，空 API key、外部动作关闭；Compose web 仅发布 127.0.0.1:3000，API/worker 不发布端口；原生预览两个监听端口均为 127.0.0.1，直接读取主题页 HTTP 200 含新增器械与黄金主题 |
| 20 个默认来源快照解析 | **20 / 20 通过，exit 0** | 原有生产解析器；详细计数见上表 |
| 电脑/手机页面检查 | 通过已检查路径 | Windows HeadlessChrome 155；1440×1000、390×844，首页/全部/主题/关于，集采筛选交互（日报由上面的 HTTP 冒烟检查覆盖）；手机关于页无横向溢出，浏览器 0 错误/0 警告 |
| 额外 Chromium/WebKit 自动化前端套件 | **未完成，不计为通过** | Linux 系统库未能补齐：Debian 下载多次 HTTP 502（含 glib-networking-common）；本机锁定浏览器包下载也未完成，已停止临时安装 |
| 独立复核 | 未发现剩余阻断问题 | 本轮主线程核对 DeepSeek/MiniMax 官方接口，tester 验证，critical_reviewer 复核模型参数、共享预算及架构检查修复；上轮器械/行情来源、日期及本机端口问题也已复核 |

本地预览：<http://localhost:3000>，仅监听本机，使用 mafi_preview_20261021 独立库。未启动 worker、未灌入虚构新闻，因此列表为空是预期；真实采集与模型服务需按待定事项配置后启动。补充自动化前端套件仍需在依赖可用的环境完整重跑，不能用页面人工/交互检查替代这项结论。

源码基线为上游提交 47531faa635c7f4313e526dd0b56312c1a23ba30。核心验证没有修改或跳过安全断言。原生 Windows 已通过最终类型检查；最初全量运行发生在配置仍写入期间，父子进程持有不同提示词快照，关停用例未能完成，故该轮已停止，不作为最终结果。项目的关停测试也依赖 POSIX SIGTERM，完整验证改在配置稳定的 Linux/Docker 快照中完成；未通过跳过或放宽断言掩盖问题。Node [官方信号说明](https://nodejs.org/docs/latest-v24.x/api/process.html#signal-events)列明 Windows 的信号行为差异。

- 适配一个原有分类纠错样例：原 AI 模型/产品现共用一节，因此改用“误标 AI 模型 → 器械集采”的跨行业纠错案例；保留原子回滚、三类报告修订、计数、冻结内容、无模型任务及撤销全部断言，聚焦 2 / 2 通过。
- 本轮验证日志位于 .data/（本地、被 Git 忽略）：providers-typecheck.log、providers-test.log、providers-web-build.log、providers-windows-web-build.log、providers-smoke.log、providers-contract.log、providers-unused-env-negative.log、providers-local-config.log、providers-local-env.json。前轮架构误报记录保留为 providers-test-before-preset-scan.log；最终全量通过以 providers-test.log 为准。信源快照摘要仍为 source-validation.json，上一轮页面截图在 output/playwright/。
- 新增 MiniMax 模型预设后，架构测试原先未扫描 site/ 模型元数据，误报两个变量未使用；现仅识别 PRESETS 的实际凭据字段，保留双向断言，没有为 MiniMax 加豁免。未知变量负向检查按预期失败，恢复后全量 935 / 935 通过，独立复核通过。
- 已生成本机 .env，用户已填写密钥；模板密钥仍为空，自动处理与采集开关仍关闭。实际配置文件被 Git 忽略，不进入交付包；连接检查的账号状态仅记录在 .data。模板生成与 Compose 回环端口均单独验证。已有 .env 不会随模板自动改绑，必须核对 PORT 后重启。
- 本地验证数据库与业务数据隔离；未接入用户已有数据库或持仓文件。

## 仍需你决定

**AA 本次已连接**：不需要重新提供 key。密钥只存本机 .env，后端已装载并完成真实数据检查，前端及示例文件无密钥。以后改 key 需重启 API；日常页面读取先复用成功快照。Tibo 保留，AIHOT 资讯已按追加要求移除。

1. **常态运行前的本机配置**：（已完成本地请求预算）密钥与本次开发评测已就绪。**本机 `mafi_test`（docker `mafi-postgres-test-20261021` @ `127.0.0.1:55432`）的 `budgets` 已收紧**：llm/deepseek 为 **10/分钟、80/小时、150/天**；embedding **5/30/50**；jina/socialdata/dajiala/zhipu/dashscope/mimo 均为 **0**。核对路径：后台 `/admin` 设置页预算表，或 `SELECT service, per_minute, per_hour, per_day FROM budgets`；重放脚本：`.data/mafi-local-budgets.sql`。`COLLECT_ENABLED` / `MODEL_CALLS_ENABLED` 仍为 **false**（未开采集/模型常态）。网站按请求数熔断，不等于按金额封顶。**仍待你决定的是**：校准/留出口径与验收（见下条）、行情接入时再定报价（见下条）、公开部署以后再定。无需开通 Grok API。
2. **行情接入时再定**：具体股票指数/市场、黄金产品/合约，以及报价供应商和额外行情预算。实时优先、可接受延时已经确认，但授权、可用接口及实际时效尚未验证；新闻和官方行情外链可先用。未替用户购买、注册或启用行情服务。
3. **正式校准的评判口径与验收**：100 条判断和理由已填齐；开发 70、留出 30 的分配不变，可评分开发 66 条，另 4 条开发样本待补正文。本次 DeepSeek Flash 的 500 次授权已执行，实际 314 次，不需要重新提供密钥或重填标注。基线漏选偏多，文字实验未改善且已恢复原文案。历史公告的“发布时值得精选”与“今天值得再发布”仍需统一；建议先按前者衡量内容价值，时效另行判断，再锁定分级规则并验收 30 条留出集。留出答案未用于调标准，数字门槛尚未校准。开发集 T1 为 61 条、T2 为 5 条、T1_5 为 0 条，仍需补充媒体与官方账号样本。见开发评测报告（本机材料，未上传）。
4. **以后再定的公开运营事项**：目前不用购买域名或服务器；如将来公开提供服务，再确认部署地、运营主体、专用邮箱、保存期限及条款隐私正式版本。现有页面草案继续保留待确认标识，未填虚构运营资料。

首批 30 条人工试标（本机材料，未上传）已由用户填写判断与理由，原表保持原样。候选来自 10 月 21 日来源快照及 10 月 22 日补查的黄金官方页面，混有旧文与边界内容；保留为开发样本，不将“应选”自动当作今日可发布消息，也未进入业务库。正文材料及待补清单见复核记录（本机材料，未上传），后续扩为 100–200 条再校准。

两批共 100 条已全部标注并完成离线验收，第二批 70 条表格（本机材料，未上传）与本机阅读材料（本机材料，未上传）保留原位。第二批为 37 应选、33 不应选；总计医药 40、AI 30、金融 30 条。正文、官网摘录及附件文字分别标明，填写前冻结的工作流分组经固定算法重算一致。可评分开发与留出金标分开保存；后续真实模型开发评测已完成，候选规则未采用，正式校准仍未完成。12 条材料类型的旧显示字段已作旁注勘误，正文实际齐全，不额外算作缺材料。

原始 AI 补充源含 GitHub 官方博客与 vLLM/Ollama Releases，目前默认暂停；外部 AI 资讯板块已移除，开启自采前仍需核对预算、精选标准和试采结果。扩展仓库名单或每日 Trending 发现可之后调整；没有新增付费采集服务。

## 自行运行与更新

按 docs/deploy.md 安装 Node.js 24.11+ 与 Docker，复制/生成 .env 后先保持所有外部动作开关为 false，设置 SITE_URL、随机管理员密码与密钥。可分阶段先确认白名单与频率、仅开启采集准备真实样本，再确认 API key 和预算、验证模型并校准精选；前端访问本身不调用模型。本机试运行时 Web/API 仅绑定 127.0.0.1，不能直接使用默认全网卡端口映射声称仅本人可见。

source seed 只新增不存在的 id；不会覆盖后台已有设置，也不会自动删除已移除的旧 AI 示例源。若接入已有站点，在后台暂停不需要的旧源，并复核同名已有源的配置，避免新旧列表混用。首次采集有条数与回灌限制，旧文章不应刷成“今日新消息”。

原始上游：[KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT)。本定制留在本地，没有向上游推送或提交 PR。

## 复现检查

先在可用的 Linux/WSL2/Docker 环境准备 Git、Node 24.11+、PostgreSQL 17 和 npm ci 依赖。完整测试中部分页面检查要求先构建 Web：

```sh
npm run typecheck
npm run build -w @aihot/web
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/mafi_test npm test
# 浏览器和系统依赖可用时，再跑额外前端套件：
node --test apps/web/tests/*.test.ts
# 按部署文档启动 API 和 Web 后：
node scripts/smoke.ts --base http://localhost:3000
```

测试库名必须以 _test 或 _ci 结尾，账号需能建库；不要指向已有业务库。完整测试内所有付费供应商请求均为本地替身，推送关闭。

## 上线准备进度 2026-10-22

本轮为安全上线准备（未开 worker、未翻 COLLECT/MODEL、未 push）。

**已完成**

- 冻结：commit `df0b816`，tag `mafi-freeze-2026-10-22`
- 本地请求预算已写入 `mafi_test`（见上条数字）；重放：`.data/mafi-local-budgets.sql`
- 密钥卫生：`.env` / `.data/**` 已 gitignore 且未跟踪；`.env.example` 中 API key / ADMIN_PASSWORD / SESSION_SECRET / POSTGRES_PASSWORD / IMG_PROXY 等为空；对已跟踪文件的 `sk-`/`ak-`/长密钥样扫描 **CLEAN**。若存在未跟踪的 `.env.example.bak-before-sanitize-20261022`，请在确认其中密钥若曾为生产用后轮换，并删除或移出仓库树
- 本机备份（无云上传）：`.data/backups/mafi-prelaunch-20261022/`（含 `.env.backup`、连通性报告、budgets sql、sealed holdout/gold、manifests、`selected-critical.zip`、`BACKUP-README.txt`）
- 绑定与开关核读：`PORT=127.0.0.1:3000`，`SITE_URL=http://localhost:3000`；`COLLECT_ENABLED=false`，`MODEL_CALLS_ENABLED=false`；`FEISHU_*_ENABLED=false`；`INDEXNOW_SUBMIT_ENABLED=false`；postgres 容器运行中且 budgets 仍为上述值

**建议下一步（不必随机选型）**

- **(A)** 可选：白名单与频率核对后，仅开 `COLLECT_ENABLED` 做采集试跑；**`MODEL_CALLS_ENABLED` 仍保持 false**
- **(B)** 留出集评测：仅在你**明确授权**额外 DeepSeek 花费后再做；当前预算上限仍生效
- **(C)** 若 bak 中密钥曾用于生产/共享，先轮换 DeepSeek/MiniMax/AA 等密钥，再删 bak

未做：公开部署、行情接入、开启模型常态、push 上游。

## 采集试跑 2026-10-22（仅采集、模型关）

- .env：COLLECT_ENABLED=true，MODEL_CALLS_ENABLED=false（推送/IndexNow 仍关）。
- mafi_preview_20261021 已套用与 mafi_test 相同的本机预算；8 个 AI 补充源已 nabled=false，保留 12 个医药/金融源。
- 单次 scripts/collect.ts（库 mafi_preview_20261021）：药监两源 HTTP 412 失败；其余 10 源成功，入库 **80** 篇（每源最多 8 条新文）。付费通道 jina/dajiala/socialdata 当日 used=0。
- 日志：.data/collect-only-20261022.log。未启动常驻 worker；未开模型。
- 药监 412 需后续换 UA/入口或人工核对方站策略，不在本轮强行绕过。

## 本机可上线验收 2026-10-22（COLLECT on / MODEL off）

目标：本机试运行验收，非公网部署。详见 [mafi-launch-acceptance.md](mafi-launch-acceptance.md)。

**已完成**

- 12/12 医药金融源采集成功；`mafi_preview_20261021` 共 **96** 篇（每源 8）。
- NMPA `HTTP 412`：根因是 Node/undici TLS 指纹触发阿里云 WAF；curl 可得 200。`web-list.ts` 对 `nmpa.gov.cn` 列表 412 回退系统 curl（未用 jina）。
- 主站预览：`http://127.0.0.1:3000`（API `127.0.0.1:3001`），脚本 `scripts/start-mafi-preview.mjs`（及 `.data/start-preview.mjs`），`COLLECT_ENABLED=true`、`MODEL_CALLS_ENABLED=false`，库 `mafi_preview_20261021`。读者栈 `3030` 仍为独立库。
- 首页非空：采集只进 `articles`；本机用 `.data/seed-collect-preview-publications.mjs` 写入 collect-preview `publications`（非模型精选）。`/api/v1/items?mode=selected&window=7d` 有条目。
- Admin：轮换口令见 `.data/backups/mafi-prelaunch-20261022/NEW-ADMIN-PASSWORD.txt`（与 `.env` 一致）；`POST /api/auth/password` → 303 + session。
- 一次性采集配方：`scripts/collect-mafi-preview.mjs`（不启常驻 worker）。

**未做 / 阻断**

- 真实模型精选与留出评测（需花费授权；勿将 `MODEL_CALLS_ENABLED` 设 true）。
- 公网域名/CDN；git push。

## MODEL-on 本机试跑 2026-10-23（Asia/Tokyo）

用户明确授权开模型并跑通真实 LLM 路径。已完成：

- .env：MODEL_CALLS_ENABLED=true（COLLECT_ENABLED=true；Feishu/IndexNow 仍 false）。**未 commit .env**。
- scripts/start-mafi-preview.mjs / .data/start-preview.mjs：MODEL/COLLECT 跟随 .env（不再写死 MODEL=false）；spawn 记录见 .data/preview-pids.json。
- 主站预览已重启：http://127.0.0.1:3000 （API :3001），库 mafi_preview_20261021；读者 :3030 未动。
- 预算未抬高：llm/deepseek 10/80/150，embedding 5/30/50，jina 等 0。
- 冒烟：.data/smoke-model-once.mjs（1 次连通）+ .data/smoke-analyze-one.mjs（1 篇分析，约 5 次）。合计约 6 次 llm 回执。
- **未**启动常驻 worker；96 篇全量模型精选会远超 150/天，配方与关 MODEL 步骤见 [mafi-model-on.md](mafi-model-on.md)。

## 预算上调 2026-10-23（Asia/Tokyo）

本机 llm / deepseek 日熔断 **300→500**，时 **280→450**，分保持 **20**（保证日上限可达；embedding 仍 5/30/50；jina 与付费抓取通道仍 **0**）。已写入 mafi_preview_20261021 与 mafi_test，重放脚本 `.data/mafi-local-budgets.sql`。软停约 **495/日**（dayStop=per_day-5）、小时软停约 **440**（hourStop=per_hour-10）。未 push；未 commit .env。

## 批跑进度 2026-10-23（Asia/Tokyo）

预算现为 llm/deepseek **20/分、450/时、500/日**（embedding 仍 5/30/50；jina 等 0）。批跑停线约 495/日。本轮已对 body_status=ok 做模型分析，并对 pending 做无 jina 免费抽取后再分析；详情见 .data/batch-analyze-hard-result.json。MODEL 保持 true；无常驻 worker；未 push / 未 commit .env。

## 自动采集 + 精选循环 2026-10-23（Asia/Tokyo）

- 新增本机调度：`scripts/mafi-auto-loop.mjs`（`start-mafi-auto.mjs` / `stop-mafi-auto.mjs`）。
- 间隔：采集 **10m**、分析/精选 **60m**；每 tick 上限约 12 篇 / 80 llm req；免费 extract 上限 12（不走 jina）。刷新页面可见新内容。
- `collect-mafi-preview.mjs` 已改为 **允许 MODEL=true**（子进程强制 MODEL off）。
- 日志 `.data/logs/`；pid 记在 `.data/preview-pids.json` 的 `autoLoop`。
- 预算仍为 llm/deepseek **20/450/500**；触顶干净停。未 push；勿 commit `.env`。

