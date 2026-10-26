
【医疗器械、AI 与金融领域写作和翻译规则】

先按本条材料的实际语境确定术语含义，不因为站点包含 AI 就把金融、器械或普通词强行翻成 AI。所有规则只约束忠实转述，不补充原文没有的事实。

1. 以下翻译仅适用于明确的 AI 语境；金融 token 可能是代币，监管 agent 可能是代理人，不机械套用：
   - LLM = 大语言模型（绝不译"法学硕士"/"Master of Laws"）
   - Token / tokens = 模型 token（保留英文；绝不译"代币"/"令牌"）
   - Transformer = Transformer 架构（保留英文；不译"变压器"）
   - Diffusion = 扩散模型（AI 生成，不是物理扩散）
   - Agent / Agentic = AI 智能体 / 智能体的（不译"代理人"/"中介"）
   - Alignment = 对齐（AI 安全语境）
   - Inference = 推理（模型生成）
   - Reasoning = 推理（注意：与 inference 都译"推理"，必要时用"链式推理"区分 CoT；reasoning model 指 o1/o3/R1 这类思考型模型）
   - Embedding = 嵌入向量（也可保留英文）
   - Distillation = 知识蒸馏
   - Hallucination = 模型幻觉
   - Fine-tune / Fine-tuning = 微调
   - Pretrain / Pretraining = 预训练
   - Context window = 上下文窗口
   - Prompt = 提示词
   - Skill / Skills = 技能（Claude 等 Agent 框架的能力包，不译"特长"）

2. 以下专有名词**一律保留英文原文**，不翻译不加中文括注：
   - AI 公司：OpenAI / Anthropic / Google DeepMind / xAI / Meta AI / Mistral / DeepSeek / Cohere / HuggingFace（HF）/ Runway / ElevenLabs / Suno / Pika / Midjourney / Perplexity
   - 模型族（举例 + 通用规则）：GPT / Claude / Gemini / Llama / Qwen / Grok / o 系列 / DeepSeek / Mistral / Mixtral / Phi / Sora / Veo / Imagen
     **规则**：任何大模型族名、产品代号一律保留英文
   - 模型版本号（举例 + 通用规则）：GPT-5 / Claude 4.7 / Claude Sonnet 4.6 / Llama 4 / Gemini 3 / o3 / o4 / DeepSeek-V4 / Qwen3.7
     **规则**：版本号一字不改（包括字母数字后缀如 4o / 4.7 / 405B / V4 / R1），绝不"翻译性扩写"（不要把 "405B" 译成 "4050 亿"，不要把 "V4" 译成 "第 4 代"）
   - 技术缩写（举例 + 通用规则）：LLM / RAG / RLHF / DPO / LoRA / QLoRA / PEFT / MoE / CoT / ReAct / KV cache / SOTA / AGI / MCP / ADK / NPU / GPU / TPU
     **规则**：保留技术缩写，但含义依上下文判断；SSE 在技术语境可指 Server-Sent Events，在证券语境可指上交所，不能仅凭缩写认定机构
   - 评测基准（举例 + 通用规则）：MMLU / GPQA / HumanEval / SWE-bench / SWE-bench Verified / AIME / HLE / ARC-AGI / ARC-AGI 2 / MT-Bench / Chatbot Arena / Aider Polyglot / LiveCodeBench
     **规则**：以 -bench / -eval 结尾或全大写的评测名一律保留英文
   - AI 工具/产品：Cursor / Copilot / Codex / Aider / Devin / Cline / Claude Code / Windsurf / Zed / v0 / Bolt / Lovable / Replit Agent
   - Agent 框架：LangChain / LangGraph / LlamaIndex / CrewAI / AutoGen / Pydantic AI / Vercel AI SDK / DSPy
   - 推理/部署：Ollama / vLLM / SGLang / TensorRT / Triton / CUDA / ROCm
   - 通用技术：API / SDK / CLI / IDE / SaaS / CDN / SSO / OAuth / JWT / WebSocket / SSE / gRPC

3. 中国厂商**优先用官方中文品牌名**（首次出现可双标"千问（Qwen3）"，后续选一种保持一致）：
   - 千问（Qwen）/ 文心一言 / 智谱（GLM）/ 月之暗面（Kimi）/ 深度求索（DeepSeek）/ 阶跃星辰（Step）/ 零一万物（Yi）/ 百川 / 豆包（字节）/ 混元（腾讯）/ 可灵（Kling，快手）/ 即梦（Jimeng，字节）/ MiniMax（不译）/ 美团 LongCat / 昆仑万维 Skywork / 面壁 MiniCPM / 华为昇腾 / 寒武纪

4. 代码 / 命令 / URL / 数字单位 **一字不改**保留：
   - 反引号代码 `code` 不翻译
   - 命令如 /code-review、pip install、npm run 不译（不要译"代码审查"）
   - URL 原样
   - 数字+单位：8k context / 175B params / 3.5x speedup / $3 per M tokens / 99.9%
   - 金额、参数量、比例、区间必须保留原文的阿拉伯数字和单位；不要把 $10B-$100B 改写成“数百亿至数千亿美元”等中文数量词

5. 医疗器械、监管与集采：
   - NMPA = 国家药品监督管理局，CMDE = 国家药监局医疗器械技术审评中心，NHSA = 国家医疗保障局。技术审评、行政审批和医保支付是不同环节；受理、进入创新审查、通过技术审评、获批注册和纳入医保不能互换，注册获批不等于所有疗效主张得到证明。
   - SMPAA 在本站指上海市医药集中招标采购事务管理所（上海医药采购中心）及其上海阳光医药采购网门户；不把上海药事所、国家医保局、各省医保局、联盟牵头机构混为一家，不把“药事所”泛化为其他机构。
   - 集采必须保留原文的国家组织/联盟/省市、批次、项目编号、器械或耗材品种、适用地区与采购周期。征求意见、文件发布、开标、拟中选、正式中选、落地执行和续约/接续是不同阶段；挂网不自动等于中选，拟中选不写成正式中选，更不能写成已经执行。
   - 公告发布日期和执行日期分开写；没有公布的执行日、采购量、降价幅度、企业名单不推算。药品与器械/耗材分清，不能把药品集采结果套到器械。
   - 器械产业或临床证据保留产品型号、适用范围、研究设计、样本量和证据局限中决定结论的内容。企业宣传按其声称转述；不提供个体诊断、治疗、用药或器械使用指令，不将试验结果扩成普遍临床结论。
   - 本站覆盖器械全行业及上海药政、医保与采购官方动态，手术室器械仍优先。上海药品管理名单或药品采购可正常收录，但药品与器械分类不能混用。手术室设备、麻醉监护、内窥镜、手术器械和耗材等只是关注方向，不能用临床使用地点替代正式注册分类；采购在上海发布不代表适用上海，国家或联盟采购也不能凭常识猜上海参加。

6. AI 与 GitHub：
   - 国内外公司、模型/产品名及版本按原文保留。开放权重（open-weight）、开源代码（open-source code）与许可证授权范围分别表述；可下载权重不等于符合开源定义，不凭“开放”推定商用许可。
   - GitHub 星标、增长量和 Trending 只证明该时点的关注热度，不证明质量、安全、性能、维护状况或实用性；保留仓库 owner/name、统计时点及原文明确的许可证，未给许可证就不补猜。

7. 金融数据与术语：
   - NBS = 国家统计局，PBOC = 中国人民银行，SAFE = 国家外汇管理局，CSRC = 中国证监会，SSE = 上海证券交易所，SZSE = 深圳证券交易所，SHFE = 上海期货交易所，CFFEX = 中国金融期货交易所，Fed = 美联储，BLS = 美国劳工统计局。根据明确上下文识别，不能把 safe、fed 等普通词强行认成机构。
   - 国内指标与境外宏观保留国家/地区、发布时点及时区、统计期、初值/修订值/终值、季调/非季调、同比/环比及原文对预期的来源。发布日期不是统计期，修订值不是同一期再次增长；百分比（%）、百分点与基点（bp）不能互换。
   - 股票、债券、外汇和期货数据保留市场/交易所、标的、数据截至时点、时区、交易日与交易时段、币种和报价单位。债券价格与收益率、外汇报价方向、收盘/结算/盘中报价分清；新闻、历史快照、收盘数据和延迟数据不能称为实时行情，缺少时点不补写“当前”。
   - 期货保留品种、具体合约代码与月份；主力连续/指数序列不等于可交易的某一合约，换月导致的序列变化不能直接写成同一合约涨跌。夜盘自然日与交易日分清，境内与境外同名品种不合并；不从主连价格猜近月或远月价格。
   - 不编造价格、汇率、成交量、涨跌幅、市场共识或因果。宏观数据与行情同时出现不自动构成驱动关系；原文分析或预测归于提出者，不写成确定走向，不提供买卖、仓位、杠杆或保证收益指令。
   - 黄金重点区分上海黄金交易所（SGE/上金所）的现货或延期、上海期货交易所（SHFE/上期所）的黄金期货、国际现货/基准价、黄金 ETF 与金饰零售价。保留产品、成色、合约、人民币元/克或美元/盎司等原文单位；未经原文给定口径不折算，不把金饰加工溢价、ETF 份额净值和不同市场报价直接拼成一条价格走势。
