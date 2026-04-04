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

// --- Skill Compiler Logic ---

export class SkillCompiler {
  private ai: OpenAI | null = null;
  private userApiKey: string;

  constructor(apiKey: string) {
    this.userApiKey = apiKey;
    if (apiKey) {
      this.ai = new OpenAI({ 
        apiKey: apiKey, 
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        dangerouslyAllowBrowser: true 
      });
    }
  }

  private async _callLLM(systemPrompt: string, userPrompt: string, usePro: boolean = false): Promise<string> {
    const modelStr = usePro ? "gemini-1.5-pro" : "gemini-1.5-flash";

    if (this.userApiKey && this.ai) {
      const response = await this.ai.chat.completions.create({
        model: modelStr,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      return response.choices[0].message.content || "";
    } else {
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
      
      if (!response.ok) {
        let errText = "网络错误：后台伪装端点调用失败，请检查 Vercel 部署。";
        try { errText = await response.text(); } catch(e) {}
        throw new Error(errText);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }
  }

  /**
   * Main entry point for compilation
   */
  async compile(pdfText: string, onProgress: (stage: string, percent: number) => void): Promise<CompilationResult> {
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
    
    onProgress("编译完成", 100);
    return {
      mainSkill,
      skills: synthesizedSkills,
      agents,
      readme
    };
  }

  private semanticChunking(text: string): string[] {
    // Simple chunking for now, could be improved with LLM-based boundary detection
    const chunkSize = 4000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async extractSkillsFromChunks(chunks: string[]): Promise<Skill[]> {
    const allSkills: Skill[] = [];
    
    // Process chunks sequentially to avoid rate limits
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await this.extractFromChunk(chunk);
      allSkills.push(...result);
      
      // Small delay between requests
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return allSkills;
  }

  private async extractFromChunk(chunk: string): Promise<Skill[]> {
    const systemContent = `你是一个专业的技能编译器。请从以下文本中提取出可执行的“技能”。
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
      // Remove markdown code blocks if present
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(text);
    } catch (e) {
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
      console.error("Failed to parse synthesized skills", e);
      return skills; // Fallback to raw skills
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

  /**
   * Generate the ZIP file
   */
  async generateZip(result: CompilationResult): Promise<Blob> {
    const zip = new JSZip();
    
    // Add main files
    zip.file("SKILL.md", result.mainSkill);
    zip.file("README.md", result.readme);
    
    // Add Agents definition
    zip.file("agents.json", JSON.stringify(result.agents, null, 2));

    // Add individual skills
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
