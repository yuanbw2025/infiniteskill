[English](./README-EN.md) | **中文文档**

# InfiniteSkill — 智能文档技能编译器

<p align="center">
  <strong>📚 → 🤖 将任意专业书籍，编译为 AI 智能体可直接调用的结构化 Skill 技能包</strong>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#核心理念">核心理念</a> •
  <a href="#技术架构">技术架构</a> •
  <a href="#实战示例">实战示例</a> •
  <a href="#api-与部署">API 与部署</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

---

## 🎯 这是什么？

**InfiniteSkill** 是一个开源的"文档→技能"编译器。它可以将任何一本专业书籍（PDF/EPUB/TXT/Markdown）自动编译为一组结构化的 **Skill 技能包**，让大模型智能体（如 OpenClaw、AutoGPT 等）能够**直接调用**书中的专业知识和操作流程。

### 💡 一句话概括

> **人类写书传授技能，InfiniteSkill 让 AI 也能「读书习技」。**

### 🤔 为什么需要它？

| 传统方式 | InfiniteSkill 方式 |
|---------|-------------------|
| 把整本书丢给 AI → 上下文爆炸、遗忘严重 | 智能拆解 → 结构化 Skill，精准调用 |
| 手动编写 Prompt → 耗时且容易遗漏 | 自动提取 → 一键生成完整技能包 |
| 单一角色 → AI 什么都做但什么都不精 | 团队建模 → 多智能体各司其职 |
| 知识散落在对话中 → 不可复用 | Skill Pack → 标准格式，永久复用 |

---

## 🔥 核心理念

InfiniteSkill 的工作方式模拟了一个**高级人力资源顾问**拿到一本专业教材后的工作流程：

```
📚 一本专业书籍
    ↓ ① 文档解析（多格式支持）
📄 全文本内容
    ↓ ② 语义拆解（按逻辑边界分块）
🧩 知识碎片
    ↓ ③ 技能提取（AI 识别可执行操作）
⚡ 原子技能列表
    ↓ ④ 逻辑建模（合并·去重·建立依赖）
🔗 技能依赖图
    ↓ ⑤ 团队建模（多智能体角色分配）
👥 智能体团队
    ↓ ⑥ 技能封装（生成标准 Skill Pack）
📦 可部署的 ZIP 技能包
```

### 四大编译阶段

| 阶段 | 图标 | 做了什么 | 输出 |
|------|------|---------|------|
| **文档解析** | 📄 | 从 PDF/EPUB/TXT/MD 提取全文 | 纯文本 |
| **语义拆解** | 🧩 | 按 4000 字符逻辑边界分块，每块独立提取技能 | Skill[] |
| **团队建模** | 🏗️ | AI 合并重复技能、建立依赖关系、设计智能体角色 | AgentRole[] |
| **技能封装** | 📦 | 生成 SKILL.md + agents.json + 各技能文件 → ZIP | Blob |

---

## 🚀 快速开始

### 在线使用（推荐）

直接访问部署好的在线版本，无需安装：

🔗 **https://your-domain.vercel.app/infiniteskill/**

上传文档 → 等待编译 → 下载 Skill Pack，就这么简单。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yuanbw2025/infiniteskill.git
cd infiniteskill

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → 浏览器打开 http://localhost:3000

# 生产构建
npm run build
```

### 前置要求

- Node.js ≥ 18（推荐 v20）
- npm ≥ 9

---

## 🏗️ 技术架构

```
┌────────────────────────────────────────────────┐
│                    前端 UI                      │
│          React 18 + TypeScript + Vite 6         │
│         Tailwind CSS 4 + Framer Motion          │
├────────────────────────────────────────────────┤
│               文档解析层 (doc-parser)            │
│    pdf.js  │  epub.js  │  原生 FileReader       │
├────────────────────────────────────────────────┤
│             技能编译引擎 (skill-compiler)         │
│  语义分块 → 技能提取 → 逻辑建模 → 团队设计 → 封装  │
├────────────────────────────────────────────────┤
│                  AI 推理层（通用多模型）            │
│  GPT / Claude / Gemini / DeepSeek / 千问 / Kimi  │
│  / GLM / 豆包 + 任何 OpenAI 兼容 API             │
│   用户自带 Key 直连 │ 免费 Gemini 代理通道        │
├────────────────────────────────────────────────┤
│                  输出层                          │
│   ZIP 技能包：SKILL.md + agents.json + skills/   │
└────────────────────────────────────────────────┘
```

### 目录结构

```
infiniteskill/
├── src/
│   ├── App.tsx              # 主应用（拖拽上传 + 编译流水线 UI）
│   ├── index.css            # Tailwind CSS 主题（中国风绢本配色）
│   ├── main.tsx             # 入口文件
│   └── lib/
│       ├── doc-parser.ts    # 多格式文档解析器（PDF/EPUB/TXT/MD）
│       ├── skill-compiler.ts # 核心编译引擎（含额度管理 + AI 调用）
│       └── utils.ts         # cn() 等工具函数
├── package.json
├── vite.config.ts           # Vite 配置（base: /infiniteskill/）
├── tsconfig.json
├── vercel.json              # Vercel 部署配置
└── metadata.json            # 应用元数据
```

### 依赖清单

| 依赖 | 用途 |
|------|------|
| `react` + `react-dom` | UI 框架 |
| `openai` | 调用各大模型 API（统一 OpenAI 兼容协议） |
| `pdfjs-dist` | PDF 文本提取（含 Web Worker） |
| `epubjs` | EPUB 电子书解析 |
| `jszip` | 生成 ZIP 技能包 |
| `motion` (Framer Motion) | 流畅的编译进度动画 |
| `lucide-react` | 精美图标库 |
| `tailwindcss` + `tailwind-merge` + `clsx` | 样式系统 |

---

## 📖 实战示例：《项目管理知识体系指南》

以一本经典的项目管理教材为例，展示 InfiniteSkill 的编译效果：

### 输入

一本 300+ 页的《项目管理知识体系指南（PMBOK）》PDF

### 编译过程

```
📊 今日剩余额度: 76/80 次 | 开始编译...
📄 文档解析中... → 提取 312 页，约 15 万字
🧩 语义拆解中... → 切分为 38 个语义块
⚡ 技能提取中... → 从 38 块中提取 47 个原子技能
🔗 逻辑建模中... → 合并去重后保留 23 个核心技能
🏗️ 团队建模中... → 设计 5 个智能体角色
📦 技能封装中... → 生成 ZIP 技能包
✅ 编译完成 | 今日已用 4/80 次 | 剩余 76 次
```

### 输出：23 个结构化 Skill

```
skills/
├── scope_definition.md          # 范围定义
├── wbs_creation.md              # WBS 工作分解
├── schedule_estimation.md       # 进度估算
├── critical_path_analysis.md    # 关键路径分析
├── cost_budgeting.md            # 成本预算
├── earned_value_analysis.md     # 挣值分析
├── risk_identification.md       # 风险识别
├── risk_response_planning.md    # 风险应对规划
├── stakeholder_analysis.md      # 干系人分析
├── communication_planning.md    # 沟通计划
├── quality_control.md           # 质量控制
├── ... (共 23 个)
```

### 输出：5 个智能体角色

```json
[
  {
    "id": "project_planner",
    "name": "项目规划师",
    "description": "负责项目范围定义、WBS 分解和进度规划",
    "skillIds": ["scope_definition", "wbs_creation", "schedule_estimation", "critical_path_analysis"]
  },
  {
    "id": "cost_controller",
    "name": "成本管控师",
    "description": "负责预算编制、成本追踪和挣值分析",
    "skillIds": ["cost_budgeting", "earned_value_analysis", "resource_allocation"]
  },
  {
    "id": "risk_manager",
    "name": "风险管理师",
    "description": "负责风险识别、评估和应对策略制定",
    "skillIds": ["risk_identification", "risk_response_planning", "risk_monitoring"]
  },
  {
    "id": "stakeholder_liaison",
    "name": "干系人协调师",
    "description": "负责干系人分析、沟通计划和团队协作",
    "skillIds": ["stakeholder_analysis", "communication_planning", "team_building"]
  },
  {
    "id": "quality_assurance",
    "name": "质量保障师",
    "description": "负责质量标准制定、检查和持续改进",
    "skillIds": ["quality_control", "process_improvement", "deliverable_validation"]
  }
]
```

### 使用效果

当 AI 智能体加载这个 Skill Pack 后，你可以这样对话：

```
👤 用户：我有一个为期 6 个月的软件开发项目，预算 200 万，团队 15 人。请帮我做完整的项目规划。

🤖 AI（自动调用多个 Skill）：
   → [project_planner] 调用 scope_definition + wbs_creation
   → [project_planner] 调用 schedule_estimation + critical_path_analysis
   → [cost_controller] 调用 cost_budgeting + resource_allocation
   → [risk_manager] 调用 risk_identification + risk_response_planning
   → [stakeholder_liaison] 调用 stakeholder_analysis + communication_planning

📋 输出：完整的项目计划书（含 WBS、甘特图数据、预算表、风险矩阵、RACI 矩阵）
```

---

## 🔑 API 与部署

### 免费使用（代理通道）

无需任何 API Key，直接使用。系统提供免费代理通道：
- 每日额度：80 次调用（4 个模型 × 20 次/模型）
- 额度按太平洋时间每日凌晨重置（约北京时间下午 3 点）
- 客户端 `localStorage` 追踪使用量

### 自带 API Key（无限制，支持 9 大提供商）

在页面「⚙️ 开发者高级权限」面板中选择你的 AI 提供商并填入 API Key。内置支持：

> **GPT** · **Claude** · **Gemini** · **DeepSeek** · **千问** · **Kimi** · **GLM** · **豆包** · **自定义（任何 OpenAI 兼容 API）**

具体模型名称在页面配置中自行填写，可随时切换最新模型。

- 直连各提供商 API，不经过任何代理
- 无调用次数限制
- Key 仅保存在你的浏览器 `localStorage` 中，绝不上传
- Claude 走原生 Anthropic Messages API；其余均走 OpenAI 兼容协议
- **自定义**选项支持任何兼容 OpenAI `/v1/chat/completions` 的服务（如 vLLM、Ollama、one-api 中转站等）

### Vercel 部署

```bash
# 使用 Vercel CLI
vercel

# 或连接 GitHub 仓库自动部署
# vercel.json 已配置好 SPA 路由重写
```

---

## 🗺️ 路线图

- [x] PDF / TXT / Markdown 文档解析
- [x] EPUB 电子书解析
- [x] Gemini 2.5 Flash / Pro 双模型支持
- [x] 免费代理通道 + 额度管理
- [x] ZIP 技能包导出
- [x] 多智能体团队建模
- [ ] 可视化技能依赖图（DAG 图）
- [ ] 支持 Word (.docx) 格式
- [ ] 技能包在线预览与编辑
- [ ] 对接 OpenClaw 一键导入
- [x] 支持 9 大 AI 模型（GPT / Claude / Gemini / DeepSeek / 千问 / Kimi / GLM / 豆包 + 自定义）
- [ ] 增量编译（新章节追加到已有技能包）
- [ ] 多语言文档支持

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

```bash
# 开发流程
git clone https://github.com/yuanbw2025/infiniteskill.git
cd infiniteskill
npm install
npm run dev

# 类型检查
npm run lint

# 构建测试
npm run build
```

### 项目结构说明

- `doc-parser.ts` — 添加新文档格式支持，实现 `extractTextFromXxx()` 函数即可
- `skill-compiler.ts` — 核心编译逻辑，修改 Prompt 可调整技能提取质量
- `App.tsx` — UI 组件，基于 Tailwind CSS

---

## 📄 许可

MIT License — 自由使用、修改、分发。

---

<p align="center">
  <strong>📚 让每一本好书，都成为 AI 的超能力</strong><br/>
  <sub>Built with ❤️ by <a href="https://github.com/yuanbw2025">yuanbw2025</a></sub>
</p>
