import OpenAI from "openai";
import JSZip from "jszip";

// --- Types ---

export interface Skill {
  id: string;
  name: string;
  trigger: string;
  inputs: string[];
  logic: string;
  outputs: string;
  dependencies: string[];
}

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
}

export interface CompilationResult {
  mainSkill: string;
  skills: Skill[];
  agents: AgentRole[];
  readme: string;
}

// ========================================
// 通用 LLM 提供商配置（OpenAI 兼容协议）
// ========================================
export interface LLMProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  defaultModel: string;       // 默认快速模型
  proModel: string;           // 推理/高质量模型
  requiresApiKey: boolean;
}

/** 预置的 LLM 提供商列表（全部兼容 OpenAI Chat Completions 格式） */
export const LLM_PROVIDERS: LLMProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
    proModel: "gemini-2.5-pro",
    requiresApiKey: true,
  },
  {
    id: "openai",
    name: "OpenAI (GPT)",
    baseURL: "https://api.openai.com/v1/",
    defaultModel: "gpt-4o-mini",
    proModel: "gpt-4o",
    requiresApiKey: true,
  },
  {
    id: "claude",
    name: "Anthropic (Claude)",
    baseURL: "https://api.anthropic.com/v1/",
    defaultModel: "claude-sonnet-4-20250514",
    proModel: "claude-sonnet-4-20250514",
    requiresApiKey: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1/",
    defaultModel: "deepseek-chat",
    proModel: "deepseek-reasoner",
    requiresApiKey: true,
  },
  {
    id: "qwen",
    name: "阿里千问 (Qwen)",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1/",
    defaultModel: "qwen-plus",
    proModel: "qwen-max",
    requiresApiKey: true,
  },
  {
    id: "kimi",
    name: "Kimi (月之暗面)",
    baseURL: "https://api.moonshot.cn/v1/",
    defaultModel: "moonshot-v1-8k",
    proModel: "moonshot-v1-128k",
    requiresApiKey: true,
  },
  {
    id: "glm",
    name: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    defaultModel: "glm-4-flash",
    proModel: "glm-4-plus",
    requiresApiKey: true,
  },
  {
    id: "doubao",
    name: "豆包 (火山引擎)",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3/",
    defaultModel: "doubao-1.5-pro-32k",
    proModel: "doubao-1.5-pro-256k",
    requiresApiKey: true,
  },
  {
    id: "custom",
    name: "自定义 (OpenAI 兼容)",
    baseURL: "",
    defaultModel: "",
    proModel: "",
    requiresApiKey: true,
  },
];

export function getProvider(id: string): LLMProviderConfig {
  return LLM_PROVIDERS.find(p => p.id === id) || LLM_PROVIDERS[0];
}

// ========================================
// 额度追踪器（localStorage，按太平洋时间自动重置）
// ========================================
export class QuotaTracker {
  private static PREFIX = 'iskill_q_';
  private static MODELS = 4;       // 降级链中的模型数量
  private static LIMIT_PER_MODEL = 20;  // 免费层每模型每天限额

  /** 获取太平洋时间的日期字符串作为 key */
  private static dateKey(): string {
    const p = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    return `${p.getFullYear()}${String(p.getMonth() + 1).padStart(2, '0')}${String(p.getDate()).padStart(2, '0')}`;
  }

  private static key(): string {
    return `${this.PREFIX}${this.dateKey()}`;
  }

  /** 记录一次成功调用 */
  static record(quotaInfo?: { exhausted?: number }): void {
    try {
      const k = this.key();
      const d = JSON.parse(localStorage.getItem(k) || '{"calls":0,"exhausted":0}');
      d.calls++;
      if (quotaInfo?.exhausted !== undefined) d.exhausted = quotaInfo.exhausted;
      localStorage.setItem(k, JSON.stringify(d));
      this.cleanup();
    } catch { }
  }

  /** 标记全部额度耗尽 */
  static recordExhausted(): void {
    try {
      const k = this.key();
      const d = JSON.parse(localStorage.getItem(k) || '{"calls":0,"exhausted":0}');
      d.exhausted = this.MODELS;
      localStorage.setItem(k, JSON.stringify(d));
    } catch { }
  }

  /** 获取当前额度状态 */
  static getStatus(): {
    callsToday: number;
    maxCalls: number;
    remaining: number;
    modelsExhausted: number;
    isExhausted: boolean;
    resetInfo: string;
  } {
    try {
      const k = this.key();
      const d = JSON.parse(localStorage.getItem(k) || '{"calls":0,"exhausted":0}');
      const max = this.MODELS * this.LIMIT_PER_MODEL; // 80
      const pacific = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      const hoursLeft = 24 - pacific.getHours();

      return {
        callsToday: d.calls,
        maxCalls: max,
        remaining: Math.max(0, max - d.calls),
        modelsExhausted: d.exhausted,
        isExhausted: d.exhausted >= this.MODELS,
        resetInfo: `约${hoursLeft}小时后重置（北京时间约下午3点）`
      };
    } catch {
      return { callsToday: 0, maxCalls: 80, remaining: 80, modelsExhausted: 0, isExhausted: false, resetInfo: '未知' };
    }
  }

  /** 清理过期的 localStorage key */
  private static cleanup(): void {
    try {
      const cur = this.key();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.PREFIX) && k !== cur) {
          localStorage.removeItem(k);
        }
      }
    } catch { }
  }
}

// --- Skill Compiler Logic ---

export class SkillCompiler {
  private ai: OpenAI | null = null;
  private userApiKey: string;
  private provider: LLMProviderConfig;

  constructor(apiKey: string, providerId: string = "gemini", customBaseURL?: string, customModel?: string, customProModel?: string) {
    this.userApiKey = apiKey;
    this.provider = getProvider(providerId);

    // 自定义提供商：覆盖 baseURL 和模型
    if (providerId === "custom") {
      if (customBaseURL) this.provider = { ...this.provider, baseURL: customBaseURL };
      if (customModel) this.provider = { ...this.provider, defaultModel: customModel };
      if (customProModel) this.provider = { ...this.provider, proModel: customProModel };
    }

    if (apiKey && this.provider.baseURL) {
      this.ai = new OpenAI({
        apiKey: apiKey,
        baseURL: this.provider.baseURL,
        dangerouslyAllowBrowser: true
      });
    }
  }

  /** 获取当前使用的提供商信息 */
  getProviderInfo(): { name: string; defaultModel: string; proModel: string } {
    return {
      name: this.provider.name,
      defaultModel: this.provider.defaultModel,
      proModel: this.provider.proModel,
    };
  }

  /**
   * Claude (Anthropic) 使用独立的 Messages API，非 OpenAI 兼容格式。
   * 需要用 fetch 直接调用原生接口。
   */
  private async _callClaude(systemPrompt: string, userPrompt: string, usePro: boolean): Promise<string> {
    const model = usePro ? this.provider.proModel : this.provider.defaultModel;
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.userApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Claude API 错误 (${resp.status}): ${err.substring(0, 300)}`);
    }
    const data = await resp.json();
    // Anthropic Messages API 返回格式: { content: [{ type: "text", text: "..." }] }
    return data.content?.[0]?.text || "";
  }

  private async _callLLM(systemPrompt: string, userPrompt: string, usePro: boolean = false): Promise<string> {
    const modelStr = usePro ? this.provider.proModel : this.provider.defaultModel;

    // --- 用户自带 Key ---
    if (this.userApiKey) {
      // Claude 走原生 Anthropic Messages API（非 OpenAI 兼容）
      if (this.provider.id === "claude") {
        return this._callClaude(systemPrompt, userPrompt, usePro);
      }

      // 其余提供商统一走 OpenAI 兼容协议
      if (this.ai) {
        const response = await this.ai.chat.completions.create({
          model: modelStr,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        });
        return response.choices[0].message.content || "";
      }
    }

    // --- 无 Key，走服务端代理 ---

    // 先检查本地额度记录，已耗尽就直接拦截，不浪费请求
    const quota = QuotaTracker.getStatus();
    if (quota.isExhausted) {
      const err = new Error(`🚫 今日免费额度已用完（已用 ${quota.callsToday} 次）。${quota.resetInfo}`);
      (err as any).isQuotaError = true;
      throw err;
    }

    const response = await fetch('/api/v2/telemetry-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Version': '8192'
      },
      body: JSON.stringify({
        system: systemPrompt,
        user: userPrompt,
        proxy: usePro ? 'pro' : 'flash'
      })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ 成功：记录调用，返回内容
      QuotaTracker.record(data._quota ? { exhausted: data._quota.exhausted } : undefined);
      return data.choices?.[0]?.message?.content || "";
    } else {
      // ❌ 失败：判断是否额度耗尽
      if (data._quota?.allExhausted) {
        QuotaTracker.recordExhausted();
        const err = new Error(data.error || `🚫 今日免费额度已全部用完。${QuotaTracker.getStatus().resetInfo}`);
        (err as any).isQuotaError = true;
        throw err;
      }
      throw new Error(data.error || "API 调用失败");
    }
  }

  /**
   * Main entry point for compilation
   */
  async compile(pdfText: string, onProgress: (stage: string, percent: number) => void): Promise<CompilationResult> {
    // 开始前报告额度
    if (!this.userApiKey) {
      const q = QuotaTracker.getStatus();
      onProgress(`📊 今日剩余额度: ${q.remaining}/${q.maxCalls} 次 | 开始编译...`, 5);
    }

    onProgress("语义拆解中...", 10);
    const chunks = this.semanticChunking(pdfText);

    onProgress("技能提取中...", 30);
    const rawSkills = await this.extractSkillsFromChunks(chunks);

    onProgress("逻辑建模中...", 60);
    const synthesizedSkills = await this.synthesizeSkills(rawSkills);

    onProgress("团队建模中...", 75);
    const agents = await this.designAgentTeam(synthesizedSkills);

    onProgress("技能封装中...", 85);
    const mainSkill = await this.generateMainSkill(synthesizedSkills);
    const readme = this.generateReadme(synthesizedSkills);

    // 完成后报告剩余额度
    if (!this.userApiKey) {
      const q = QuotaTracker.getStatus();
      onProgress(`✅ 编译完成 | 今日已用 ${q.callsToday}/${q.maxCalls} 次 | 剩余 ${q.remaining} 次`, 100);
    } else {
      onProgress("编译完成", 100);
    }

    return {
      mainSkill,
      skills: synthesizedSkills,
      agents,
      readme
    };
  }

  private semanticChunking(text: string): string[] {
    const chunkSize = 4000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async extractSkillsFromChunks(chunks: string[]): Promise<Skill[]> {
    const allSkills: Skill[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await this.extractFromChunk(chunk);
      allSkills.push(...result);
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return allSkills;
  }

  private async extractFromChunk(chunk: string): Promise<Skill[]> {
    const systemContent = `你是一个专业的技能编译器。请从以下文本中提取出可执行的"技能"。
每个技能应包含：唯一ID、名称、触发条件、输入参数、执行逻辑（步骤）、输出格式、依赖关系。`;
    const userContent = `文本内容：
${chunk}

请以 JSON 数组格式返回，必须仅输出合法的 JSON 数组，不加任何解释或其他字符。
示例格式：
[
  {
    "id": "string",
    "name": "string",
    "trigger": "string",
    "inputs": ["string"],
    "logic": "string",
    "outputs": "string",
    "dependencies": ["string"]
  }
]`;

    try {
      let text = await this._callLLM(systemContent, userContent, false);
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(text);
    } catch (e) {
      if ((e as any).isQuotaError) throw e;  // 额度错误必须抛出
      console.error("Failed to parse AI response", e);
      return [];
    }
  }

  private async synthesizeSkills(skills: Skill[]): Promise<Skill[]> {
    const systemContent = `你是一个高级逻辑建模专家。`;
    const userContent = `以下是从文档中初步提取的技能列表。
请进行以下操作：
1. 合并功能重复的技能。
2. 建立清晰的逻辑依赖关系（A技能是B技能的前置）。
3. 确保每个技能的逻辑步骤清晰、可执行。
4. 优化技能名称和触发条件，使其更符合 AI 助手的调用习惯。

初步技能列表：
${JSON.stringify(skills)}

请以 JSON 数组格式返回优化后的技能列表，必须仅输出合法的 JSON 数组，格式同输入一致，不加任何解释或其他字符。`;

    try {
      let text = await this._callLLM(systemContent, userContent, true);
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(text);
    } catch (e) {
      if ((e as any).isQuotaError) throw e;
      console.error("Failed to parse synthesized skills", e);
      return skills;
    }
  }

  private async designAgentTeam(skills: Skill[]): Promise<AgentRole[]> {
    const systemContent = `你是一个多智能体系统(Multi-Agent System)架构师。`;
    const userContent = `我已经从一份专业文档中提取了以下技能(Skills)：
    ${JSON.stringify(skills.map(s => ({ id: s.id, name: s.name, description: s.trigger })), null, 2)}

    请根据这些技能的领域和逻辑关联，设计一个智能体团队(Agent Team)。
    将这些技能分配给不同的智能体角色。每个角色应该像真实公司里的专业岗位。
    
    请返回一个 JSON 数组，每个元素包含：
    - id: 角色唯一英文标识 (如 project_manager)
    - name: 角色中文名称
    - description: 角色职责描述，让用户一眼就知道这个角色是做什么的
    - skillIds: 该角色拥有的技能 ID 列表 (必须是上面提供的技能 ID)

    只返回 JSON 数组，不要任何 markdown 标记。`;

    try {
      let text = await this._callLLM(systemContent, userContent, true);
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(text);
    } catch (e) {
      if ((e as any).isQuotaError) throw e;
      console.error("Failed to parse agent team", e);
      return [{
        id: "general_assistant",
        name: "全能助手",
        description: "掌握文档中所有技能的通用助手",
        skillIds: skills.map(s => s.id)
      }];
    }
  }

  private async generateMainSkill(skills: Skill[]): Promise<string> {
    const systemContent = `你是一个 Markdown 报告生成器。`;
    const userContent = `根据以下技能列表，生成一个主技能文件 (SKILL.md)。
这个文件应该包含：
1. 技能包的总览和目标。
2. 核心工作流（如何组合这些技能解决复杂问题）。
3. 技能索引表。

技能列表：
${JSON.stringify(skills)}

请直接返回 Markdown 内容。`;

    return await this._callLLM(systemContent, userContent, false);
  }

  private generateReadme(skills: Skill[]): string {
    return `# InfiniteSkill 编译产出物

这是一个自动生成的技能包，包含 ${skills.length} 个独立技能。

## 如何使用
1. 解压此文件。
2. 将内容放入你的 AI 助手（如 OpenClaw）的 skills 目录。
3. 重启 AI 助手。

## 技能列表
${skills.map(s => `- **${s.name}**: ${s.trigger}`).join("\n")}
`;
  }

  async generateZip(result: CompilationResult): Promise<Blob> {
    const zip = new JSZip();
    zip.file("SKILL.md", result.mainSkill);
    zip.file("README.md", result.readme);
    zip.file("agents.json", JSON.stringify(result.agents, null, 2));

    const skillsFolder = zip.folder("skills");
    if (skillsFolder) {
      result.skills.forEach(skill => {
        const content = `---
id: ${skill.id}
name: ${skill.name}
trigger: ${skill.trigger}
inputs: ${JSON.stringify(skill.inputs)}
dependencies: ${JSON.stringify(skill.dependencies)}
---

# ${skill.name}

## 触发场景
${skill.trigger}

## 输入参数
${skill.inputs.map(i => `- ${i}`).join("\n")}

## 执行逻辑
${skill.logic}

## 输出结果
${skill.outputs}
`;
        skillsFolder.file(`${skill.id}.md`, content);
      });
    }

    return await zip.generateAsync({ type: "blob" });
  }
}