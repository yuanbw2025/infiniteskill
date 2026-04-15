**English** | [中文文档](./README.md)

# InfiniteSkill — Smart Document Skill Compiler

<p align="center">
  <strong>📚 → 🤖 Compile any professional book into structured Skill packs that AI agents can directly invoke</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#core-concept">Core Concept</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#example">Example</a> •
  <a href="#api--deployment">API & Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎯 What is this?

**InfiniteSkill** is an open-source "Document → Skill" compiler. It can automatically compile any professional book (PDF/EPUB/TXT/Markdown) into a set of structured **Skill Packs**, enabling LLM agents (such as OpenClaw, AutoGPT, etc.) to **directly invoke** the professional knowledge and operational procedures from the book.

### 💡 In One Sentence

> **Humans write books to teach skills. InfiniteSkill lets AI "learn skills by reading books" too.**

### 🤔 Why do we need it?

| Traditional Approach | InfiniteSkill Approach |
|---------------------|----------------------|
| Dump an entire book into AI → context explosion, severe forgetting | Smart decomposition → structured Skills, precise invocation |
| Manually write prompts → time-consuming, easy to miss things | Auto-extraction → one-click complete Skill Pack generation |
| Single role → AI does everything but excels at nothing | Team modeling → multi-agent, each with clear responsibilities |
| Knowledge scattered in conversations → not reusable | Skill Pack → standard format, permanently reusable |

---

## 🔥 Core Concept

InfiniteSkill simulates the workflow of a **senior HR consultant** when handed a professional textbook:

```
📚 A Professional Book
    ↓ ① Document Parsing (multi-format support)
📄 Full Text Content
    ↓ ② Semantic Chunking (split by logical boundaries)
🧩 Knowledge Fragments
    ↓ ③ Skill Extraction (AI identifies executable operations)
⚡ Atomic Skill List
    ↓ ④ Logic Modeling (merge, deduplicate, build dependencies)
🔗 Skill Dependency Graph
    ↓ ⑤ Team Modeling (multi-agent role assignment)
👥 Agent Team
    ↓ ⑥ Skill Packaging (generate standard Skill Pack)
📦 Deployable ZIP Skill Pack
```

### Four Compilation Stages

| Stage | Icon | What it does | Output |
|-------|------|-------------|--------|
| **Document Parsing** | 📄 | Extract full text from PDF/EPUB/TXT/MD | Plain text |
| **Semantic Chunking** | 🧩 | Split by 4000-char logical boundaries, extract skills per chunk | Skill[] |
| **Team Modeling** | 🏗️ | AI merges duplicate skills, builds dependencies, designs agent roles | AgentRole[] |
| **Skill Packaging** | 📦 | Generate SKILL.md + agents.json + skill files → ZIP | Blob |

---

## 🚀 Quick Start

### Online Usage (Recommended)

Use the deployed online version directly, no installation needed:

🔗 **https://your-domain.vercel.app/infiniteskill/**

Upload a document → wait for compilation → download Skill Pack. That's it.

### Local Development

```bash
# Clone the repo
git clone https://github.com/yuanbw2025/infiniteskill.git
cd infiniteskill

# Install dependencies
npm install

# Start dev server
npm run dev
# → Open http://localhost:3000 in your browser

# Production build
npm run build
```

### Prerequisites

- Node.js ≥ 18 (v20 recommended)
- npm ≥ 9

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────┐
│                  Frontend UI                    │
│          React 18 + TypeScript + Vite 6         │
│         Tailwind CSS 4 + Framer Motion          │
├────────────────────────────────────────────────┤
│            Document Parser (doc-parser)          │
│      pdf.js  │  epub.js  │  native FileReader   │
├────────────────────────────────────────────────┤
│          Skill Compiler Engine                   │
│  Chunking → Extraction → Modeling → Teaming →   │
│                  Packaging                       │
├────────────────────────────────────────────────┤
│           AI Inference Layer (Multi-Model)       │
│  GPT / Claude / Gemini / DeepSeek / Qwen / Kimi │
│  / GLM / Doubao + Any OpenAI-compatible API     │
│   User's own Key │ Free Gemini proxy channel    │
├────────────────────────────────────────────────┤
│                  Output Layer                    │
│   ZIP Skill Pack: SKILL.md + agents.json +      │
│                   skills/                        │
└────────────────────────────────────────────────┘
```

### Directory Structure

```
infiniteskill/
├── src/
│   ├── App.tsx              # Main app (drag-upload + compilation pipeline UI)
│   ├── index.css            # Tailwind CSS theme (Chinese silk-paper palette)
│   ├── main.tsx             # Entry point
│   └── lib/
│       ├── doc-parser.ts    # Multi-format document parser (PDF/EPUB/TXT/MD)
│       ├── skill-compiler.ts # Core compiler engine (with quota mgmt + AI calls)
│       └── utils.ts         # cn() and other utilities
├── package.json
├── vite.config.ts           # Vite config (base: /infiniteskill/)
├── tsconfig.json
├── vercel.json              # Vercel deployment config
└── metadata.json            # App metadata
```

### Dependencies

| Dependency | Purpose |
|-----------|---------|
| `react` + `react-dom` | UI framework |
| `openai` | Call various LLM APIs (unified OpenAI-compatible protocol) |
| `pdfjs-dist` | PDF text extraction (with Web Worker) |
| `epubjs` | EPUB e-book parsing |
| `jszip` | Generate ZIP Skill Packs |
| `motion` (Framer Motion) | Smooth compilation progress animations |
| `lucide-react` | Beautiful icon library |
| `tailwindcss` + `tailwind-merge` + `clsx` | Styling system |

---

## 📖 Example: "A Guide to the Project Management Body of Knowledge"

Using a classic project management textbook to demonstrate InfiniteSkill's compilation results:

### Input

A 300+ page "Project Management Body of Knowledge (PMBOK)" PDF

### Compilation Process

```
📊 Daily quota remaining: 76/80 | Starting compilation...
📄 Parsing document... → Extracted 312 pages, ~150K characters
🧩 Semantic chunking... → Split into 38 semantic chunks
⚡ Extracting skills... → Extracted 47 atomic skills from 38 chunks
🔗 Logic modeling... → Merged & deduplicated to 23 core skills
🏗️ Team modeling... → Designed 5 agent roles
📦 Packaging skills... → Generated ZIP Skill Pack
✅ Compilation complete | Used 4/80 today | 76 remaining
```

### Output: 23 Structured Skills

```
skills/
├── scope_definition.md          # Scope Definition
├── wbs_creation.md              # WBS Work Breakdown
├── schedule_estimation.md       # Schedule Estimation
├── critical_path_analysis.md    # Critical Path Analysis
├── cost_budgeting.md            # Cost Budgeting
├── earned_value_analysis.md     # Earned Value Analysis
├── risk_identification.md       # Risk Identification
├── risk_response_planning.md    # Risk Response Planning
├── stakeholder_analysis.md      # Stakeholder Analysis
├── communication_planning.md    # Communication Planning
├── quality_control.md           # Quality Control
├── ... (23 in total)
```

### Output: 5 Agent Roles

```json
[
  {
    "id": "project_planner",
    "name": "Project Planner",
    "description": "Handles project scope definition, WBS breakdown, and schedule planning",
    "skillIds": ["scope_definition", "wbs_creation", "schedule_estimation", "critical_path_analysis"]
  },
  {
    "id": "cost_controller",
    "name": "Cost Controller",
    "description": "Handles budget preparation, cost tracking, and earned value analysis",
    "skillIds": ["cost_budgeting", "earned_value_analysis", "resource_allocation"]
  },
  {
    "id": "risk_manager",
    "name": "Risk Manager",
    "description": "Handles risk identification, assessment, and response strategy development",
    "skillIds": ["risk_identification", "risk_response_planning", "risk_monitoring"]
  },
  {
    "id": "stakeholder_liaison",
    "name": "Stakeholder Liaison",
    "description": "Handles stakeholder analysis, communication planning, and team collaboration",
    "skillIds": ["stakeholder_analysis", "communication_planning", "team_building"]
  },
  {
    "id": "quality_assurance",
    "name": "Quality Assurance Lead",
    "description": "Handles quality standard setting, inspection, and continuous improvement",
    "skillIds": ["quality_control", "process_improvement", "deliverable_validation"]
  }
]
```

### Usage in Practice

After an AI agent loads this Skill Pack, you can have conversations like:

```
👤 User: I have a 6-month software development project with a budget of $280K and a team of 15.
         Please help me create a complete project plan.

🤖 AI (automatically invoking multiple Skills):
   → [project_planner] invokes scope_definition + wbs_creation
   → [project_planner] invokes schedule_estimation + critical_path_analysis
   → [cost_controller] invokes cost_budgeting + resource_allocation
   → [risk_manager] invokes risk_identification + risk_response_planning
   → [stakeholder_liaison] invokes stakeholder_analysis + communication_planning

📋 Output: A complete project plan (including WBS, Gantt chart data, budget sheet,
           risk matrix, RACI matrix)
```

---

## 🔑 API & Deployment

### Free Usage (Proxy Channel)

No API Key needed, use directly. The system provides a free proxy channel:
- Daily quota: 80 calls (4 models × 20 calls/model)
- Quota resets daily at midnight Pacific Time (~3 PM Beijing Time)
- Usage tracked via client-side `localStorage`

### Bring Your Own API Key (Unlimited, 9 Providers Supported)

Select your AI provider and enter your API Key in the "⚙️ Developer Advanced Settings" panel. Built-in support for:

> **GPT** · **Claude** · **Gemini** · **DeepSeek** · **Qwen** · **Kimi** · **GLM** · **Doubao** · **Custom (any OpenAI-compatible API)**

Specific model names can be configured on the page and switched at any time.

- Direct connection to each provider's API, no proxy involved
- No call limits
- Keys are stored only in your browser's `localStorage`, never uploaded
- Claude uses the native Anthropic Messages API; all others use the OpenAI-compatible protocol
- The **Custom** option supports any service compatible with OpenAI's `/v1/chat/completions` (e.g., vLLM, Ollama, one-api relay, etc.)

### Vercel Deployment

```bash
# Using Vercel CLI
vercel

# Or connect your GitHub repo for auto-deployment
# vercel.json is pre-configured with SPA route rewrites
```

---

## 🗺️ Roadmap

- [x] PDF / TXT / Markdown document parsing
- [x] EPUB e-book parsing
- [x] Gemini 2.5 Flash / Pro dual-model support
- [x] Free proxy channel + quota management
- [x] ZIP Skill Pack export
- [x] Multi-agent team modeling
- [ ] Visual skill dependency graph (DAG)
- [ ] Word (.docx) format support
- [ ] Online Skill Pack preview & editing
- [ ] OpenClaw one-click import
- [x] 9 AI model providers (GPT / Claude / Gemini / DeepSeek / Qwen / Kimi / GLM / Doubao + Custom)
- [ ] Incremental compilation (append new chapters to existing Skill Packs)
- [ ] Multi-language document support

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

```bash
# Development workflow
git clone https://github.com/yuanbw2025/infiniteskill.git
cd infiniteskill
npm install
npm run dev

# Type checking
npm run lint

# Build test
npm run build
```

### Project Structure Guide

- `doc-parser.ts` — To add new document format support, implement an `extractTextFromXxx()` function
- `skill-compiler.ts` — Core compilation logic; modify prompts to adjust skill extraction quality
- `App.tsx` — UI components, built with Tailwind CSS

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

<p align="center">
  <strong>📚 Turn every great book into a superpower for AI</strong><br/>
  <sub>Built with ❤️ by <a href="https://github.com/yuanbw2025">yuanbw2025</a></sub>
</p>
