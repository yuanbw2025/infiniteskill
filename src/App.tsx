import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileUp, 
  FileText, 
  Cpu, 
  Network, 
  Package, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  BookOpen,
  Zap,
  Layers,
  FileCode2,
  Workflow,
  Users,
  Briefcase,
  ShieldAlert,
  RefreshCw,
  Settings,
  Save,
  Github
} from "lucide-react";
import { extractTextFromFile } from "./lib/doc-parser";
import { SkillCompiler, CompilationResult } from "./lib/skill-compiler";
import { cn } from "./lib/utils";

type StepStatus = "idle" | "loading" | "complete" | "error";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const STEPS: Step[] = [
  { id: "parsing", title: "文档解析", description: "提取多格式文本与结构", icon: FileText },
  { id: "analyzing", title: "语义拆解", description: "识别核心概念与操作", icon: Cpu },
  { id: "modeling", title: "团队建模", description: "构建智能体与技能树", icon: Network },
  { id: "packaging", title: "团队封装", description: "生成 OpenClaw 团队包", icon: Package },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    parsing: "idle",
    analyzing: "idle",
    modeling: "idle",
    packaging: "idle",
  });
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("");

  const [apiKey, setApiKey] = useState(localStorage.getItem("infinite_skill_api_key") || "");
  const [showSettings, setShowSettings] = useState(false);

  const compiler = useMemo(() => new SkillCompiler(apiKey), [apiKey]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setCurrentStepIndex(-1);
      setStepStatuses({
        parsing: "idle",
        analyzing: "idle",
        modeling: "idle",
        packaging: "idle",
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md", ".markdown"],
      "application/epub+zip": [".epub"]
    },
    multiple: false,
    disabled: isCompiling,
  });

  const handleCompile = async () => {
    if (!file) return;

    setIsCompiling(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Parsing
      setCurrentStepIndex(0);
      setStepStatuses(prev => ({ ...prev, parsing: "loading" }));
      setProgressText("正在提取文档文本...");
      const text = await extractTextFromFile(file);
      setStepStatuses(prev => ({ ...prev, parsing: "complete" }));

      // Step 2-4: AI Compilation
      const compilationResult = await compiler.compile(text, (stage, percent) => {
        setProgressText(stage);
        if (percent < 30) setCurrentStepIndex(1);
        else if (percent < 60) setCurrentStepIndex(2);
        else setCurrentStepIndex(3);

        if (percent >= 30) setStepStatuses(prev => ({ ...prev, analyzing: percent >= 60 ? "complete" : "loading" }));
        if (percent >= 60) setStepStatuses(prev => ({ ...prev, modeling: percent >= 85 ? "complete" : "loading" }));
        if (percent >= 85) setStepStatuses(prev => ({ ...prev, packaging: percent >= 100 ? "complete" : "loading" }));
      });

      setResult(compilationResult);
      setStepStatuses({
        parsing: "complete",
        analyzing: "complete",
        modeling: "complete",
        packaging: "complete",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "编译过程中发生错误");
      setStepStatuses(prev => {
        const newStatuses = { ...prev };
        const currentStepId = STEPS[currentStepIndex]?.id;
        if (currentStepId) newStatuses[currentStepId] = "error";
        return newStatuses;
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const blob = await compiler.generateZip(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Extract filename without extension
    const fileNameWithoutExt = file?.name.replace(/\.[^/.]+$/, "") || "export";
    a.download = `agents_${fileNameWithoutExt}.zip`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen compiler-gradient p-0 flex flex-col items-center">
      {/* Navigation Bar */}
      <nav className="w-full px-[4%] h-14 flex items-center justify-between bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border sticky top-0 z-50">
        <a href="/" className="text-brand-primary font-black text-xl tracking-[6px] no-underline hover:opacity-80 transition-opacity">悬 象</a>
        <span className="text-gray-500 text-xs tracking-widest hidden md:inline">却顾所来径，苍苍横翠微</span>
        <a href="/" className="text-brand-primary text-sm font-semibold no-underline hover:opacity-70 transition-opacity tracking-wide">← 返回主页</a>
      </nav>

      {/* Header */}
      <header className="w-full max-w-5xl mb-12 text-center px-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium mb-6"
        >
          <Zap className="w-4 h-4" />
          <span>InfiniteSkill · AI Skill Compiler v2.0</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tight mb-4"
        >
          Infinite<span className="text-brand-primary">Skill</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-brand-secondary text-lg max-w-2xl mx-auto leading-relaxed"
        >
          一键将专业书籍编译为大模型可直接调用的结构化 Skill 技能包 —— 赋予 AI 智能体真正的领域专业能力，而非泛泛而谈的通用回答。
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
           className="mt-4 text-sm text-gray-500 max-w-xl mx-auto"
        >
          上传任何 PDF / EPUB / TXT / Markdown 格式的专业文档，InfiniteSkill 将自动提取知识结构、拆解技能节点、构建智能体团队，输出可被大语言模型原生加载的 Skill Pack。
        </motion.div>
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="mt-6 flex justify-center"
        >
          <a href="https://github.com/yuanbw2025/infiniteskill/archive/refs/heads/main.zip"
             className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl">
             <Github className="w-5 h-5" />
             下载开源代码 (ZIP)
          </a>
        </motion.div>
      </header>

      <main className="w-full max-w-5xl space-y-8">
        
        {/* Settings Panel */}
        <div className="w-full glass-card p-6">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setShowSettings(!showSettings)}
          >
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Settings className="w-5 h-5 text-brand-primary" />
              开发者高级权限
            </h2>
            <ChevronRight className={cn("w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-transform", showSettings && "rotate-90")} />
          </div>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6">
                  <div>
                    <label className="block text-sm text-gray-600 font-medium mb-2">私有大模型 API Key（选填）</label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={e => {
                        setApiKey(e.target.value);
                        localStorage.setItem("infinite_skill_api_key", e.target.value);
                      }}
                      placeholder="如果您有自己的专属 Key 可在此处填写，若不填则走工具免费代理通道"
                      className="w-full bg-white/50 border border-brand-border rounded-lg px-4 py-3 text-sm text-gray-900 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Save className="w-3 h-3" /> 您的输入即刻自动保存在本地浏览器中，彻底杜绝云端泄露
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upload Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <div 
            {...getRootProps()}
            className={cn(
              "glass-card p-12 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer transition-all duration-300",
              isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-brand-border hover:border-brand-primary/50",
              isCompiling && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
              <FileUp className="w-8 h-8 text-brand-primary" />
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-xl font-medium mb-1">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl font-medium mb-1">点击或拖拽文档到此处</p>
                <p className="text-gray-500 text-sm">支持 PDF, EPUB, TXT, MD 格式的专业书籍、操作手册、行业报告等</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Button */}
        {file && !result && !error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-3"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  编译中...
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  开始编译
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Pipeline Visualization */}
        <AnimatePresence>
          {(isCompiling || result || error) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-card p-8"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 relative">
                {STEPS.map((step, index) => {
                  const StatusIcon = stepStatuses[step.id] === "complete" ? CheckCircle2 : 
                                    stepStatuses[step.id] === "error" ? AlertCircle : 
                                    stepStatuses[step.id] === "loading" ? Loader2 : step.icon;
                  
                  return (
                    <div key={step.id} className="flex-1 flex flex-col items-center text-center relative z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-500",
                        stepStatuses[step.id] === "complete" ? "bg-brand-primary text-white" :
                        stepStatuses[step.id] === "loading" ? "bg-brand-primary/20 text-brand-primary animate-pulse" :
                        stepStatuses[step.id] === "error" ? "bg-red-500/20 text-red-500" : "bg-gray-200 text-gray-400"
                      )}>
                        <StatusIcon className={cn("w-6 h-6", stepStatuses[step.id] === "loading" && "animate-spin")} />
                      </div>
                      <h3 className={cn(
                        "font-bold mb-1",
                        stepStatuses[step.id] === "idle" ? "text-gray-600" : "text-gray-100"
                      )}>{step.title}</h3>
                      <p className="text-xs text-gray-500">{step.description}</p>
                      
                      {index < STEPS.length - 1 && (
                        <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-[2px] bg-gray-200">
                          <motion.div 
                            className="h-full bg-brand-primary"
                            initial={{ width: 0 }}
                            animate={{ width: stepStatuses[step.id] === "complete" ? "100%" : "0%" }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {isCompiling && (
                <div className="mt-8 text-center">
                  <p className="text-brand-primary font-mono text-sm animate-pulse">{progressText}</p>
                </div>
              )}

              {error && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">编译成功！</h2>
                    <p className="text-gray-600">已生成 {result.agents.length} 个智能体角色，共 {result.skills.length} 项技能</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full md:w-auto px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  下载团队包 (ZIP)
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    智能体团队 (Agent Team)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.agents.map(agent => (
                      <div key={agent.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-brand-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-primary/15 flex items-center justify-center text-brand-primary font-bold text-lg">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{agent.name}</h4>
                            <p className="text-xs text-gray-400 font-mono">{agent.id}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">拥有技能:</p>
                          {agent.skillIds.map(skillId => {
                            const skill = result.skills.find(s => s.id === skillId);
                            return skill ? (
                              <div key={skillId} className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border truncate text-gray-700">
                                <span className="text-brand-primary mr-1">✦</span> {skill.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation & Case Study Section */}
        {!isCompiling && !result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 space-y-12"
          >
            {/* What is InfiniteSkill */}
            <section className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Layers className="w-8 h-8 text-brand-primary" />
                <h2 className="text-2xl font-bold">什么是 InfiniteSkill？</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-gray-700 leading-relaxed">
                <div>
                  <p className="mb-4">
                    <strong className="text-gray-900">InfiniteSkill</strong> 不是一个简单的“文档总结”工具，而是一个<strong className="text-brand-primary">智能文档技能编译器</strong>。
                  </p>
                  <p className="mb-4">
                    普通的 AI 总结只能给你一段粗略的“读后感”，对话结束后知识就丢失了。而 InfiniteSkill 会深入分析文档的语义密度，将专业书籍、操作手册、行业规范中的核心概念、操作步骤和异常处理分支，提取并封装成一套<strong className="text-gray-900">结构完整、可直接导入 OpenClaw 等 AI 助手的智能体团队（Agent Team）与技能包（Skills）</strong>。
                  </p>
                </div>
                  <div className="bg-white/60 border border-brand-border rounded-xl p-6">
                  <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-brand-primary" />
                    核心优势
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                      <span><strong>语义拆解：</strong>不按章节机械切割，而是按逻辑边界智能拆分。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                      <span><strong>团队建模：</strong>像真实公司一样，将技能分配给不同的专业 Agent 角色。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                      <span><strong>永久复用：</strong>技能包跨会话存在，无需每次重新喂文档。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                      <span><strong>零上下文占用：</strong>OpenClaw 仅在触发条件满足时按需调用专属 Agent 的技能。</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Case Study */}
            <section className="glass-card p-8 md:p-12 border-brand-primary/30">
              <div className="flex items-center gap-3 mb-6">
                <Workflow className="w-8 h-8 text-brand-primary" />
                <h2 className="text-2xl font-bold">实战案例：从《PMBOK® 指南》到项目管理智能体团队</h2>
              </div>
              <div className="space-y-6 text-gray-700">
                <p>
                  假设你上传了著名的<strong>《项目管理知识体系指南 (PMBOK® 指南) 第七版》</strong>。InfiniteSkill 不会给你一个简单的摘要，而是会将其编译成一个由多个专业角色组成的虚拟项目管理办公室 (PMO)，可直接导入 <strong>OpenClaw</strong>。
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/50 border border-brand-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-gray-800 font-bold text-sm">战略与治理专家</h4>
                        <div className="text-blue-600 text-xs font-mono">strategic_governance</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">负责项目与组织战略对齐，制定裁剪策略，确保价值交付。</p>
                    <div className="space-y-2">
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 价值交付系统分析</div>
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 项目裁剪流程制定</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 border border-brand-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-600">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-gray-800 font-bold text-sm">风险与不确定性管理者</h4>
                        <div className="text-orange-600 text-xs font-mono">risk_manager</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">专门识别、评估并应对项目中的复杂性、模糊性与风险。</p>
                    <div className="space-y-2">
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 风险应对策略优化</div>
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 复杂性导航与降解</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 border border-brand-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-600">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-gray-800 font-bold text-sm">敏捷与交付教练</h4>
                        <div className="text-green-600 text-xs font-mono">agile_coach</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">指导团队选择开发方法，管理交付节奏与质量，提升团队韧性。</p>
                    <div className="space-y-2">
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 适应型生命周期规划</div>
                      <div className="text-xs bg-brand-primary/5 px-2 py-1.5 rounded border border-brand-border">✦ 质量与过程融合</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-sm">
                  <strong>实际效果：</strong>将这个团队包导入 <strong>OpenClaw</strong> 后，当你遇到项目难题时，你可以直接 @风险与不确定性管理者，它会调用专属的 <code>风险应对策略优化</code> 技能，按照 PMBOK 标准为你提供专业的解决方案，就像拥有了一个真实的专家智囊团。
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 pb-8 text-gray-500 text-sm text-center">
        <p>© 2026 InfiniteSkill · 悬象出品 · Powered by Gemini 3.1 Pro</p>
        <p className="mt-2 text-brand-primary/60 font-medium">不是总结，是结构化编译。</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}
