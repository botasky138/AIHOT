// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * tagColor 是飞书推送卡片里跟在标题后面的这一类小标签的颜色（飞书 text_tag 的颜色名）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "device-policy", tagColor: "blue", label: "医药监管", section: "医药与医疗器械", guide: "医疗器械全行业的注册审评、准入、质量安全与支付政策，以及上海药政和医保官方动态、药品管理名单与支付安排，手术室器械仍优先。区分征求意见、正式发布和生效；采购具体进展归集采，企业经营归器械产业。普通药品广告及无器械或上海政策关联的药品产品消息不因机构身份自动纳入。" },
  { key: "device-procurement", tagColor: "blue", label: "集采动态", section: "医药与医疗器械", guide: "上海器械、耗材及药品采购、挂网、接续、申报问答与实施培训，手术室器械仍优先；也追踪明确影响上海的国家/联盟采购。保留适用地区、批次、品种及征求意见/发布/开标/拟中选/正式中选/执行/续约阶段；上海药事所是发布方不等于项目仅适用上海，也不等于国家集采。" },
  { key: "device-industry", tagColor: "blue", label: "器械产业", section: "医药与医疗器械", guide: "医疗器械全行业的产业趋势、研发、临床证据、供需、经营和供应链变化，优先手术室设备、手术器械与耗材。监管审批归医药监管，采购项目归集采；保留明确的产品适用范围，不因临床使用地点猜测注册分类，不提供诊疗建议。" },
  { key: "ai-models", tagColor: "indigo", label: "模型", feedLabel: "AI 模型", section: "AI 模型与产业", guide: "模型本身的发布、版本、权重开放、能力或价格变化，以及既有榜单上的模型成绩。公布一次跑分不是发布新基准，也不是教程。" },
  { key: "ai-products", tagColor: "turquoise", label: "产品", feedLabel: "AI 产品", section: "AI 模型与产业", guide: "可使用的 AI 产品、功能、应用、工具、API、平台和工程组件的发布更新，包括 GitHub AI 项目。模型厂商发布的推理框架、算子库、硬件适配组件仍是产品，不能因为厂商名归成模型。" },
  { key: "industry", tagColor: "orange", label: "AI公司", feedLabel: "行业动态", section: "AI 模型与产业", guide: "AI 公司经营、融资并购、人事、合作、诉讼、AI 政策、真实安全事故及调查进展，覆盖国内外厂商。新闻由当事人发帖、带有态度，也不因此变成观点。器械产业、医药监管及金融事件分别归对应类别。" },
  { key: "paper", tagColor: "violet", label: "研究", feedLabel: "论文", section: "AI 模型与产业", guide: "以 AI 新研究方法、实验设计与发现为核心的论文、技术报告、新基准或研究数据集。系统性红队实验属于研究；既有榜单成绩归模型，真实事故的新闻调查归 AI 公司。器械临床研究以器械产业为重心时归器械产业。" },
  { key: "tip", tagColor: "green", label: "教程", section: "AI 模型与产业", guide: "可复用的 AI 方法、提示词、工具用法、工程实践复盘与技术讲解。单纯发布工具归产品，只有态度和预测而无做法归观点。", commentary: true },
  { key: "macro", tagColor: "orange", label: "宏观指标", section: "金融市场与宏观", guide: "国内指标、货币财政政策与海外宏观，重点与股票、黄金有关的影响。保留发布时点、统计期、同比/环比、初值/修订值和预测；利率、美元与地缘因素按原文证据表述，不从同时涨跌推断确定因果。" },
  { key: "markets", tagColor: "orange", label: "股票", feedLabel: "股票市场", section: "金融市场与宏观", guide: "境内外股票市场、上市公司、指数、证券制度与有明确时点的市场数据。保留市场、标的、币种、交易时段和延迟；纯债券/外汇行情不作独立重点，重要政策和对股金的宏观影响归宏观指标。以金价或黄金 ETF 为主的材料归黄金。" },
  { key: "derivatives", tagColor: "orange", label: "黄金", feedLabel: "黄金市场", section: "金融市场与宏观", guide: "黄金现货、延期、期货与黄金 ETF 的市场变化、交易交割、保证金与合约规则。区分上海金、国际现货、具体期货合约、主连、ETF 和金饰零售价，保留报价单位、币种、时间与延迟；主连换月不当同一合约涨跌，非黄金衍生品仅保留对股票黄金有实质影响的事件。" },
  { key: "opinion", tagColor: "purple", label: "观点", section: "趋势与分析", guide: "医疗器械、AI 或金融的解释、判断、主张、预测、评论与访谈观点，用主题标签标明领域。具体公告、数据发布或采购进展按对应新闻类别归类；作者是名人不自动归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（AI 行业是新模型）：日报报头的“N 个新模型”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "ai-models", tag: "模型发布", unit: "个新模型" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["ai", "api", "llm", "gpu", "agi", "ceo", "ipo", "gdp", "cpi", "ppi", "pmi", "lpr", "bp", "etf", "医疗器械", "医用耗材", "集采", "宏观", "期货"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "产品更新", "模型发布", "论文/研究", "开源/仓库", "教程/实践", "现象/趋势", "大佬观点", "评测/基准", "安全/对齐", "行业动态", "政策/监管",
  "非AI/通用工具", "其他", "集采/采购", "宏观/数据", "市场动态",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "Agent", "编码", "推理", "多模态", "语音", "视频", "图像生成", "RAG", "端侧", "数据/训练", "搜索", "部署/工程", "开源生态", "具身智能", "MCP/工具调用",
  "医疗器械", "医用耗材", "注册/审评", "医保/支付", "带量采购", "国家集采", "联盟集采", "省市采购", "上海药事所", "上海采购", "手术室器械", "手术器械", "手术耗材", "内窥镜", "麻醉监护", "器械产业", "临床证据", "GitHub热点", "开放权重", "开源许可",
  "宏观经济", "国内指标", "货币政策", "财政政策", "海外宏观", "股票", "黄金", "黄金现货", "黄金期货", "黄金ETF", "债券", "外汇", "期货", "期权", "商品", "利率", "市场监管",
] as const;

/** 可选的实体标签（公司、机构、平台）。 */
export const ENTITY_TAGS = ["OpenAI", "Anthropic", "DeepSeek", "DeepMind", "Google", "Meta", "Microsoft", "xAI", "Hugging Face", "GitHub", "arXiv", "NMPA", "CMDE", "NHSA", "SMPAA", "NBS", "PBOC", "SAFE", "CSRC", "SSE", "SZSE", "SGE", "SHFE", "CFFEX", "Fed", "BLS"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "教程/玩法": "教程/实践", "技巧/最佳实践": "教程/实践", "合作/生态": "行业动态", "融资/收购": "行业动态", "公司动态": "行业动态",
  合作: "行业动态", 生态: "行业动态", 融资: "行业动态", 收购: "行业动态", 投资: "行业动态", 并购: "行业动态",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 安全: "安全/对齐", 对齐: "安全/对齐",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究",
  "open-source": "开源/仓库", 开源: "开源/仓库", 仓库: "开源/仓库", repo: "开源/仓库",
  教程: "教程/实践", 玩法: "教程/实践", 指南: "教程/实践", 技巧: "教程/实践", 最佳实践: "教程/实践", 实践: "教程/实践",
  产品: "产品更新", 更新: "产品更新", 发布: "模型发布", 模型: "模型发布", 趋势: "现象/趋势", 现象: "现象/趋势", 观点: "大佬观点",
  视频生成: "视频", 非ai: "非AI/通用工具", "non-ai": "非AI/通用工具", 通用工具: "非AI/通用工具", 工程工具: "非AI/通用工具",
  安全扫描: "非AI/通用工具", devops: "非AI/通用工具", 行业: "行业动态", 动态: "行业动态",
  集采: "集采/采购", 采购: "集采/采购", 带量采购: "带量采购", 宏观数据: "宏观/数据", 行情: "市场动态",
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；orgNames 是这家公司发消息时开头用的组织名（公司、实验室、团队），
 * 在它自己的主题页上读者知道说的是谁，可以省去；otherNames 是公司的其他称呼（官方账号名、子品牌）。
 * 所有这些名字都用来认出说的是哪家公司，比如把事实的主体对到发布方。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  "world-labs": { name: "World Labs", displayTag: null, aliases: ["World Labs"] },
  "thinking-machines": { name: "Thinking Machines Lab", displayTag: null, aliases: ["Thinking Machines"] },
  amd: { name: "AMD", displayTag: null, aliases: ["AMD", "Advanced Micro Devices"] },
  openai: { name: "OpenAI", displayTag: "OpenAI", aliases: ["OpenAI", "ChatGPT", "Sora", "Codex", "GPT"], orgNames: ["OpenAI"], otherNames: ["OpenAI Developers"] },
  anthropic: { name: "Anthropic", displayTag: "Anthropic", aliases: ["Anthropic", "Claude"], orgNames: ["Anthropic"], otherNames: ["Claude Code"] },
  google: { name: "Google", displayTag: "Google", aliases: ["Google", "DeepMind", "Gemini", "谷歌"], orgNames: ["Google DeepMind", "Google Research", "Google", "DeepMind", "谷歌"], otherNames: ["Google AI", "Google Labs", "Google Cloud"] },
  deepseek: { name: "DeepSeek", displayTag: "DeepSeek", aliases: ["DeepSeek", "深度求索"], orgNames: ["DeepSeek", "深度求索"] },
  qwen: { name: "千问 Qwen", displayTag: null, aliases: ["Qwen", "通义", "阿里"], orgNames: ["通义千问", "通义实验室", "阿里巴巴", "阿里云", "阿里", "Qwen Team", "Qwen", "Alibaba"], otherNames: ["千问", "千问APP", "Alibaba Cloud"] },
  kimi: { name: "Kimi / 月之暗面", displayTag: null, aliases: ["Kimi", "月之暗面", "Moonshot"], orgNames: ["Moonshot AI", "月之暗面", "Kimi"] },
  minimax: { name: "MiniMax", displayTag: null, aliases: ["MiniMax", "海螺"], orgNames: ["MiniMax", "稀宇科技"] },
  zhipu: { name: "智谱 GLM", displayTag: null, aliases: ["智谱", "GLM", "Z.ai"], orgNames: ["智谱AI", "智谱", "Zhipu AI", "Z.ai"], otherNames: ["Zhipu"] },
  xai: { name: "xAI", displayTag: "xAI", aliases: ["xAI", "Grok"], orgNames: ["SpaceX Super Intelligence", "SpaceXAI", "SpaceXSI", "xAI"], otherNames: ["Grok Bot"] },
  meta: { name: "Meta", displayTag: "Meta", aliases: ["Meta", "Llama"], orgNames: ["Meta Superintelligence Labs", "Meta AI", "Meta"], otherNames: ["AI at Meta", "Muse"] },
  microsoft: { name: "Microsoft", displayTag: "Microsoft", aliases: ["Microsoft", "微软", "Copilot"], orgNames: ["Microsoft Research", "Microsoft AI", "Microsoft", "微软"] },
  nvidia: { name: "NVIDIA", displayTag: null, aliases: ["NVIDIA", "英伟达"], orgNames: ["NVIDIA", "英伟达"] },
  "hugging-face": { name: "Hugging Face", displayTag: "Hugging Face", aliases: ["Hugging Face"], orgNames: ["Hugging Face", "HuggingFace"] },
  cursor: { name: "Cursor", displayTag: null, aliases: ["Cursor", "Anysphere"], orgNames: ["Cursor"] },
  openrouter: { name: "OpenRouter", displayTag: null, aliases: ["OpenRouter"], orgNames: ["OpenRouter"] },
  github: { name: "GitHub", displayTag: "GitHub", aliases: ["GitHub"], orgNames: ["GitHub"] },
  vllm: { name: "vLLM", displayTag: null, aliases: ["vLLM"], orgNames: ["vLLM"] },
  ollama: { name: "Ollama", displayTag: null, aliases: ["Ollama"], orgNames: ["Ollama"] },
  nmpa: { name: "国家药品监督管理局", displayTag: "NMPA", aliases: ["NMPA", "国家药品监督管理局", "国家药监局"], orgNames: ["国家药品监督管理局", "国家药监局"] },
  cmde: { name: "国家药监局医疗器械技术审评中心", displayTag: "CMDE", aliases: ["CMDE", "医疗器械技术审评中心", "器审中心"], orgNames: ["国家药品监督管理局医疗器械技术审评中心", "国家药监局医疗器械技术审评中心", "医疗器械技术审评中心"] },
  nhsa: { name: "国家医疗保障局", displayTag: "NHSA", aliases: ["NHSA", "国家医疗保障局", "国家医保局"], orgNames: ["国家医疗保障局", "国家医保局"] },
  smpaa: { name: "上海市医药集中招标采购事务管理所", displayTag: "SMPAA", aliases: ["SMPAA", "上海市医药集中招标采购事务管理所", "上海阳光医药采购网", "上海药事所"], orgNames: ["上海市医药集中招标采购事务管理所", "上海医药采购中心"], otherNames: ["上海阳光医药采购网", "上海药事所"] },
  nbs: { name: "国家统计局", displayTag: "NBS", aliases: ["NBS", "国家统计局", "National Bureau of Statistics of China"], orgNames: ["国家统计局"] },
  pboc: { name: "中国人民银行", displayTag: "PBOC", aliases: ["PBOC", "中国人民银行", "People's Bank of China"], orgNames: ["中国人民银行"], otherNames: ["人民银行"] },
  safe: { name: "国家外汇管理局", displayTag: "SAFE", aliases: ["SAFE", "国家外汇管理局", "State Administration of Foreign Exchange"], orgNames: ["国家外汇管理局"] },
  csrc: { name: "中国证券监督管理委员会", displayTag: "CSRC", aliases: ["CSRC", "中国证券监督管理委员会", "中国证监会"], orgNames: ["中国证券监督管理委员会", "中国证监会"] },
  sse: { name: "上海证券交易所", displayTag: "SSE", aliases: ["SSE", "上海证券交易所", "上交所"], orgNames: ["上海证券交易所"] },
  szse: { name: "深圳证券交易所", displayTag: "SZSE", aliases: ["SZSE", "深圳证券交易所", "深交所"], orgNames: ["深圳证券交易所"] },
  sge: { name: "上海黄金交易所", displayTag: "SGE", aliases: ["SGE", "上海黄金交易所", "上金所"], orgNames: ["上海黄金交易所"] },
  shfe: { name: "上海期货交易所", displayTag: "SHFE", aliases: ["SHFE", "上海期货交易所", "上期所"], orgNames: ["上海期货交易所"] },
  cffex: { name: "中国金融期货交易所", displayTag: "CFFEX", aliases: ["CFFEX", "中国金融期货交易所", "中金所"], orgNames: ["中国金融期货交易所"] },
  fed: { name: "美联储", displayTag: "Fed", aliases: ["Fed", "Federal Reserve", "美联储"], orgNames: ["Federal Reserve", "Board of Governors of the Federal Reserve System", "美联储"] },
  bls: { name: "美国劳工统计局", displayTag: "BLS", aliases: ["BLS", "美国劳工统计局", "Bureau of Labor Statistics"], orgNames: ["Bureau of Labor Statistics", "美国劳工统计局"] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "openai", name: "OpenAI", patterns: [/openai|chatgpt|\bgpt-?[o\d]|\bsora\b|\bcodex\b/i] },
  { id: "anthropic", name: "Anthropic", patterns: [/anthropic|\bclaude\b/i, /\b(?:opus|sonnet|haiku)\s*\d+(?:[.\-]\d+)*\b/i, /\bfable\s*\d+(?:[.\-]\d+)*\b|\bmythos\b/i] },
  { id: "google", name: "Google / Gemini", patterns: [/google|deepmind|\bgemini\b|notebooklm|\bveo\s?\d|\bAlphaFold\b|\bAMIE\b/i] },
  { id: "deepseek", name: "DeepSeek", patterns: [/deepseek|深度求索/i] },
  { id: "xai", name: "xAI / Grok", patterns: [/\bxai\b|\bgrok\b/i] },
  { id: "meta", name: "Meta / Llama", patterns: [/\bMeta\b/, /\bmeta\s?ai\b|\bllama\b/i] },
  { id: "microsoft", name: "Microsoft / Copilot", patterns: [/microsoft|copilot|微软/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/nvidia|英伟达|\bnemotron\b|\bnemo\b|\bblackwell\b|\brubin(?:\s+ultra)?\b|\bcuda\b/i] },
  { id: "qwen", name: "千问 Qwen", patterns: [/\bqwen|通义|千问/i] },
  { id: "hugging-face", name: "Hugging Face", patterns: [/hugging\s?face/i] },
  { id: "cursor", name: "Cursor", patterns: [/\bCursor\b/] },
  { id: "kimi", name: "Kimi / 月之暗面", patterns: [/\bkimi\b|月之暗面|\bmoonshot\s?ai\b/i] },
  { id: "openrouter", name: "OpenRouter", patterns: [/openrouter/i] },
  { id: "minimax", name: "MiniMax", patterns: [/minimax/i] },
  { id: "zhipu", name: "智谱 GLM", patterns: [/智谱|\bglm-?[4-9]/i] },
  { id: "hunyuan", name: "腾讯混元", patterns: [/混元|hunyuan/i] },
  { id: "doubao", name: "字节豆包", patterns: [/豆包|doubao|字节跳动|bytedance/i] },
  { id: "mistral", name: "Mistral", patterns: [/mistral/i] },
  { id: "perplexity", name: "Perplexity", patterns: [/\bPerplexity\b/] },
  { id: "runway", name: "Runway", patterns: [/\brunway\b/i] },
  { id: "suno", name: "Suno", patterns: [/\bsuno\b/i] },
  { id: "midjourney", name: "Midjourney", patterns: [/midjourney/i] },
  { id: "stability-ai", name: "Stability AI", patterns: [/stability\s?ai/i] },
  { id: "elevenlabs", name: "ElevenLabs", patterns: [/eleven\s?labs/i] },
  { id: "vllm", name: "vLLM", patterns: [/\bvllm\b/i] },
  { id: "ollama", name: "Ollama", patterns: [/\bollama\b/i] },
  { id: "windsurf", name: "Windsurf", patterns: [/windsurf/i] },
  { id: "devin", name: "Devin", patterns: [/\bdevin\b/i] },
  { id: "manus", name: "Manus", patterns: [/\bmanus\b/i] },
  { id: "apple", name: "Apple AI", patterns: [/\bapple\s?(intelligence|silicon|ai)\b|苹果(智能|\s?AI)/i] },
  { id: "amazon", name: "Amazon / AWS", patterns: [/amazon|\baws\b|亚马逊/i] },
  { id: "baidu", name: "百度文心", patterns: [/百度|baidu|文心|\bernie\s?bot\b/i] },
  { id: "github", name: "GitHub", patterns: [/\bgithub\b/i] },
  { id: "nmpa", name: "国家药监局", patterns: [/\bNMPA\b|国家药品监督管理局(?!\s*医疗器械技术审评中心)|国家药监局(?!\s*医疗器械技术审评中心)/i] },
  { id: "cmde", name: "医疗器械技术审评中心", patterns: [/\bCMDE\b|医疗器械技术审评中心|器审中心/i] },
  { id: "nhsa", name: "国家医保局", patterns: [/\bNHSA\b|国家医疗保障局|国家医保局/i] },
  { id: "smpaa", name: "上海药事所", patterns: [/\bSMPAA\b|上海市医药集中招标采购事务管理所|上海阳光医药采购网|上海药事所|上海医药采购中心/i] },
  { id: "nbs", name: "国家统计局", patterns: [/\bNBS\b|国家统计局|National Bureau of Statistics of China/i] },
  { id: "pboc", name: "中国人民银行", patterns: [/\bPBOC\b|中国人民银行|人民银行|People['’]s Bank of China/i] },
  { id: "safe", name: "国家外汇管理局", patterns: [/国家外汇管理局|State Administration of Foreign Exchange/i, /\bSAFE\b(?=.{0,40}(?:外汇|国际收支|foreign exchange))/] },
  { id: "csrc", name: "中国证监会", patterns: [/\bCSRC\b|中国证券监督管理委员会|中国证监会/i] },
  { id: "sse", name: "上海证券交易所", patterns: [/上海证券交易所|上交所|Shanghai Stock Exchange/i, /\bSSE\b(?=.{0,40}(?:证券|股票|上证|综指|交易所))/] },
  { id: "szse", name: "深圳证券交易所", patterns: [/\bSZSE\b|深圳证券交易所|深交所/i] },
  { id: "sge", name: "上海黄金交易所", patterns: [/\bSGE\b|上海黄金交易所|上金所/] },
  { id: "shfe", name: "上海期货交易所", patterns: [/\bSHFE\b|上海期货交易所|上期所/i] },
  { id: "cffex", name: "中国金融期货交易所", patterns: [/\bCFFEX\b|中国金融期货交易所|中金所/i] },
  { id: "fed", name: "美联储", patterns: [/\bFed\b|Federal Reserve|美联储/] },
  { id: "bls", name: "美国劳工统计局", patterns: [/\bBLS\b|Bureau of Labor Statistics|美国劳工统计局/i] },
];

/** 这些域名上的文章，发布方就是对应公司或机构。GitHub 只绑定官方博客/文档，github.com 托管仓库与 arXiv 不算。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "openai", domains: ["openai.com"] },
  { entityId: "anthropic", domains: ["anthropic.com", "claude.com"] },
  { entityId: "google", domains: ["deepmind.google", "ai.google", "blog.google"] },
  { entityId: "deepseek", domains: ["deepseek.com"] },
  { entityId: "xai", domains: ["x.ai"] },
  { entityId: "meta", domains: ["ai.meta.com"] },
  { entityId: "microsoft", domains: ["microsoft.com"] },
  { entityId: "nvidia", domains: ["nvidia.com"] },
  { entityId: "qwen", domains: ["qwen.ai"] },
  { entityId: "cursor", domains: ["cursor.com"] },
  { entityId: "openrouter", domains: ["openrouter.ai"] },
  { entityId: "github", domains: ["github.blog", "docs.github.com"] },
  { entityId: "nmpa", domains: ["nmpa.gov.cn"] },
  { entityId: "cmde", domains: ["cmde.org.cn"] },
  { entityId: "nhsa", domains: ["nhsa.gov.cn"] },
  { entityId: "smpaa", domains: ["smpaa.cn"] },
  { entityId: "nbs", domains: ["stats.gov.cn"] },
  { entityId: "pboc", domains: ["pbc.gov.cn"] },
  { entityId: "safe", domains: ["safe.gov.cn"] },
  { entityId: "csrc", domains: ["csrc.gov.cn"] },
  { entityId: "sse", domains: ["sse.com.cn"] },
  { entityId: "szse", domains: ["szse.cn"] },
  { entityId: "sge", domains: ["sge.com.cn"] },
  { entityId: "shfe", domains: ["shfe.com.cn"] },
  { entityId: "cffex", domains: ["cffex.com.cn"] },
  { entityId: "fed", domains: ["federalreserve.gov"] },
  { entityId: "bls", domains: ["bls.gov"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "meta", pattern: /@AIatMeta\b/i },
  { entityId: "zhipu", pattern: /\bZhipu(?:\s+AI\b|['’]s\b)/i },
];
