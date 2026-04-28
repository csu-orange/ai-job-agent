const skillDictionary = [
  "javascript",
  "typescript",
  "react",
  "vue",
  "node",
  "node.js",
  "express",
  "next.js",
  "python",
  "java",
  "go",
  "golang",
  "c++",
  "sql",
  "mysql",
  "postgresql",
  "redis",
  "mongodb",
  "docker",
  "kubernetes",
  "linux",
  "git",
  "ci/cd",
  "aws",
  "azure",
  "gcp",
  "figma",
  "axure",
  "excel",
  "tableau",
  "power bi",
  "机器学习",
  "深度学习",
  "数据分析",
  "数据建模",
  "用户增长",
  "用户研究",
  "竞品分析",
  "产品设计",
  "项目管理",
  "需求分析",
  "原型设计",
  "a/b",
  "saas",
  "b端",
  "crm",
  "运营",
  "内容运营",
  "社群运营",
  "销售",
  "客户成功",
  "英语",
  "跨部门协作"
];

const roleSignals = [
  "前端",
  "后端",
  "全栈",
  "数据",
  "算法",
  "产品经理",
  "项目经理",
  "运营",
  "市场",
  "销售",
  "客户成功",
  "设计",
  "测试",
  "DevOps"
];

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "keywordFit",
    "rewritePlan",
    "tailoredResume",
    "coverLetter",
    "interview",
    "applicationPlan",
    "agentTrace"
  ],
  properties: {
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["matchScore", "verdict", "strongestFit", "mainRisks", "recommendedStrategy"],
      properties: {
        matchScore: { type: "number" },
        verdict: { type: "string" },
        strongestFit: { type: "array", items: { type: "string" } },
        mainRisks: { type: "array", items: { type: "string" } },
        recommendedStrategy: { type: "string" }
      }
    },
    keywordFit: {
      type: "object",
      additionalProperties: false,
      required: ["matched", "missing", "resumeSignals"],
      properties: {
        matched: { type: "array", items: { type: "string" } },
        missing: { type: "array", items: { type: "string" } },
        resumeSignals: { type: "array", items: { type: "string" } }
      }
    },
    rewritePlan: {
      type: "object",
      additionalProperties: false,
      required: ["positioning", "bulletsToImprove", "keywordGaps"],
      properties: {
        positioning: { type: "string" },
        bulletsToImprove: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["original", "issue", "rewrite"],
            properties: {
              original: { type: "string" },
              issue: { type: "string" },
              rewrite: { type: "string" }
            }
          }
        },
        keywordGaps: { type: "array", items: { type: "string" } }
      }
    },
    tailoredResume: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "summary", "coreSkills", "experienceBullets", "projectBullets"],
      properties: {
        headline: { type: "string" },
        summary: { type: "string" },
        coreSkills: { type: "array", items: { type: "string" } },
        experienceBullets: { type: "array", items: { type: "string" } },
        projectBullets: { type: "array", items: { type: "string" } }
      }
    },
    coverLetter: { type: "string" },
    interview: {
      type: "object",
      additionalProperties: false,
      required: ["likelyQuestions", "starStories", "questionsToAsk"],
      properties: {
        likelyQuestions: { type: "array", items: { type: "string" } },
        starStories: { type: "array", items: { type: "string" } },
        questionsToAsk: { type: "array", items: { type: "string" } }
      }
    },
    applicationPlan: {
      type: "object",
      additionalProperties: false,
      required: ["nextActions", "followUpMessage"],
      properties: {
        nextActions: { type: "array", items: { type: "string" } },
        followUpMessage: { type: "string" }
      }
    },
    agentTrace: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "status", "detail"],
        properties: {
          step: { type: "string" },
          status: { type: "string" },
          detail: { type: "string" }
        }
      }
    }
  }
};

async function analyze(payload) {
  const resume = normalizeInput(payload.resume);
  const jobDescription = normalizeInput(payload.jobDescription);
  const targetRole = normalizeInput(payload.targetRole || "目标岗位");
  const seniority = normalizeInput(payload.seniority || "未指定");

  if (resume.length < 30 || jobDescription.length < 30) {
    const error = new Error("Resume and job description are required");
    error.statusCode = 400;
    error.publicMessage = "请至少输入 30 个字符的简历内容和岗位 JD。";
    throw error;
  }

  const provider = resolveProvider();

  if (provider === "nvidia") {
    try {
      return await callNvidia({ resume, jobDescription, targetRole, seniority });
    } catch (error) {
      const fallback = runLocalAgent({ resume, jobDescription, targetRole, seniority });
      fallback.engine = "nvidia-fallback";
      fallback.warning = `NVIDIA API 调用失败，已切换到本地分析：${error.message}`;
      return fallback;
    }
  }

  if (provider === "openai") {
    try {
      return await callOpenAI({ resume, jobDescription, targetRole, seniority });
    } catch (error) {
      const fallback = runLocalAgent({ resume, jobDescription, targetRole, seniority });
      fallback.engine = "local-fallback";
      fallback.warning = `OpenAI API 调用失败，已切换到本地分析：${error.message}`;
      return fallback;
    }
  }

  const report = runLocalAgent({ resume, jobDescription, targetRole, seniority });
  report.engine = "local";
  return report;
}

function resolveProvider() {
  const configured = String(process.env.AI_PROVIDER || "").trim().toLowerCase();

  if (configured === "nvidia") {
    return process.env.NVIDIA_API_KEY ? "nvidia" : "local";
  }

  if (configured === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : "local";
  }

  if (configured === "local") {
    return "local";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  if (process.env.NVIDIA_API_KEY) {
    return "nvidia";
  }

  return "local";
}

async function callOpenAI({ resume, jobDescription, targetRole, seniority }) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: [
        "你是一个严谨、务实的中文求职 Agent。",
        "你负责把简历和岗位 JD 转换为可执行的求职策略。",
        "不要编造不存在的经历。若证据不足，要明确写成建议补充。",
        "所有输出使用中文，内容要具体、可复制、可执行。"
      ].join("\n"),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `目标岗位：${targetRole}`,
                `候选人职级：${seniority}`,
                "",
                "【简历】",
                resume,
                "",
                "【岗位 JD】",
                jobDescription,
                "",
                "请完成：匹配度评分、优势与风险、关键词差距、简历改写、定制简历摘要、面试准备、投递行动计划。"
              ].join("\n")
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "job_agent_report",
          strict: true,
          schema: responseSchema
        }
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error && data.error.message ? data.error.message : response.statusText;
    throw new Error(message);
  }

  const outputText = extractOutputText(data);
  if (!outputText) {
    throw new Error("模型没有返回可解析文本。");
  }

  const parsed = JSON.parse(outputText);
  parsed.engine = "openai";
  return parsed;
}

async function callNvidia({ resume, jobDescription, targetRole, seniority }) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }

  const baseUrl = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
  const timeoutMs = Number(process.env.NVIDIA_TIMEOUT_MS || 25000);
  const maxTokens = Number(process.env.NVIDIA_MAX_TOKENS || 2048);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: [
              "你是一个严谨、务实的中文求职 Agent。",
              "你负责把简历和岗位 JD 转换为可执行的求职策略。",
              "不要编造不存在的经历。若证据不足，要明确写成建议补充。",
              "必须只返回一个 JSON object，不要 Markdown，不要解释文字。",
              "JSON 必须包含这些顶层字段：summary, keywordFit, rewritePlan, tailoredResume, coverLetter, interview, applicationPlan, agentTrace。"
            ].join("\n")
          },
          {
            role: "user",
            content: buildModelPrompt({ resume, jobDescription, targetRole, seniority })
          }
        ]
      })
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`NVIDIA API ${timeoutMs}ms 内没有返回。请检查模型 ID、额度或稍后重试。`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error && data.error.message ? data.error.message : response.statusText;
    throw new Error(message);
  }

  const content = data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : "";

  if (!content) {
    throw new Error("NVIDIA 模型没有返回可解析文本。");
  }

  const parsed = parseJsonObject(content);
  assertReportShape(parsed);
  parsed.engine = "nvidia";
  return parsed;
}

function buildModelPrompt({ resume, jobDescription, targetRole, seniority }) {
  return [
    `目标岗位：${targetRole}`,
    `候选人职级：${seniority}`,
    "",
    "【简历】",
    resume,
    "",
    "【岗位 JD】",
    jobDescription,
    "",
    "请输出严格 JSON，字段结构如下：",
    JSON.stringify(responseSchema),
    "",
    "请完成：匹配度评分、优势与风险、关键词差距、简历改写、定制简历摘要、面试准备、投递行动计划。"
  ].join("\n");
}

function parseJsonObject(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw error;
  }
}

function assertReportShape(report) {
  const required = ["summary", "keywordFit", "rewritePlan", "tailoredResume", "coverLetter", "interview", "applicationPlan", "agentTrace"];
  const missing = required.filter((key) => !report || typeof report[key] === "undefined");
  if (missing.length) {
    throw new Error(`模型返回结构缺少字段：${missing.join(", ")}`);
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const stack = Array.isArray(data.output) ? [...data.output] : [];
  while (stack.length) {
    const item = stack.shift();
    if (!item || typeof item !== "object") {
      continue;
    }
    if (item.type === "output_text" && typeof item.text === "string") {
      return item.text;
    }
    if (typeof item.text === "string" && item.type === "text") {
      return item.text;
    }
    if (Array.isArray(item.content)) {
      stack.push(...item.content);
    }
  }

  return "";
}

function runLocalAgent({ resume, jobDescription, targetRole, seniority }) {
  const resumeSkills = findTerms(resume, skillDictionary);
  const jdSkills = findTerms(jobDescription, skillDictionary);
  const matched = jdSkills.filter((skill) => resumeSkills.includes(skill));
  const missing = jdSkills.filter((skill) => !resumeSkills.includes(skill));
  const resumeSignals = extractResumeSignals(resume);
  const roleMatches = findTerms(`${targetRole}\n${jobDescription}`, roleSignals);
  const quantifiedSignals = extractQuantifiedSignals(resume);
  const score = calculateScore({ resume, jobDescription, matched, missing, resumeSignals, quantifiedSignals });
  const strongestFit = buildStrengths({ matched, resumeSignals, quantifiedSignals, roleMatches });
  const mainRisks = buildRisks({ missing, resumeSignals, quantifiedSignals, targetRole });
  const selectedBullets = selectResumeBullets(resume);
  const rewriteBullets = selectedBullets.slice(0, 4).map((bullet, index) => ({
    original: bullet,
    issue: bulletHasMetric(bullet) ? "表达方向可以更贴近 JD 关键词。" : "缺少量化结果或业务影响，筛选系统和面试官都不容易判断价值。",
    rewrite: rewriteBullet(bullet, matched, missing, index)
  }));

  const headline = buildHeadline(targetRole, matched, seniority);
  const recommendedStrategy = buildStrategy(score, missing, matched);

  return {
    summary: {
      matchScore: score,
      verdict: buildVerdict(score),
      strongestFit,
      mainRisks,
      recommendedStrategy
    },
    keywordFit: {
      matched,
      missing,
      resumeSignals
    },
    rewritePlan: {
      positioning: `把简历主线收敛到“${headline}”，优先呈现与 JD 直接相关的项目、指标和协作场景。`,
      bulletsToImprove: rewriteBullets.length ? rewriteBullets : fallbackRewriteBullets(matched, missing),
      keywordGaps: missing.slice(0, 8).map((skill) => `补充能证明“${skill}”的项目、工具链、结果指标或学习证明。`)
    },
    tailoredResume: {
      headline,
      summary: buildTailoredSummary(targetRole, matched, resumeSignals, quantifiedSignals),
      coreSkills: unique([...matched, ...resumeSkills]).slice(0, 12),
      experienceBullets: buildExperienceBullets(matched, missing, [...quantifiedSignals]),
      projectBullets: buildProjectBullets(targetRole, matched, missing)
    },
    coverLetter: buildCoverLetter(targetRole, matched, missing, score),
    interview: {
      likelyQuestions: buildInterviewQuestions(targetRole, matched, missing),
      starStories: buildStarStories(matched, missing),
      questionsToAsk: [
        "这个岗位入职后前三个月最核心的交付目标是什么？",
        "团队目前最希望新成员解决的流程、技术或业务问题是什么？",
        "这个岗位的绩效衡量更看重业务结果、项目交付还是跨团队协作？"
      ]
    },
    applicationPlan: {
      nextActions: [
        "先把简历顶部摘要改成与 JD 对齐的 3 句话，避免泛泛介绍。",
        `补齐 ${missing.slice(0, 3).join("、") || "岗位关键能力"} 的证据，每个证据至少包含场景、动作和结果。`,
        "为最相关的 2 个项目准备 STAR 复盘，重点说明你的决策、权衡和指标变化。",
        "投递后 24-48 小时内发送一段简短跟进信息，突出岗位匹配点。"
      ],
      followUpMessage: `您好，我已投递${targetRole}岗位。我的经历与岗位中的${matched.slice(0, 3).join("、") || "核心要求"}较为匹配，也准备好了相关项目细节，期待有机会进一步沟通。`
    },
    agentTrace: [
      { step: "读取输入", status: "done", detail: "已解析简历、目标岗位、职级和 JD。" },
      { step: "提取关键词", status: "done", detail: `从 JD 中识别 ${jdSkills.length} 个关键能力，简历中命中 ${matched.length} 个。` },
      { step: "匹配评估", status: "done", detail: `综合技能命中、量化成果和角色一致性，得到 ${score} 分。` },
      { step: "生成策略", status: "done", detail: "已输出简历改写、定制摘要、面试问题和投递计划。" }
    ]
  };
}

function normalizeInput(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function findTerms(text, terms) {
  const lowerText = text.toLowerCase();
  return unique(
    terms.filter((term) => {
      const lowerTerm = term.toLowerCase();
      if (/^[a-z0-9+#./-]+$/i.test(term)) {
        return new RegExp(`(^|[^a-z0-9])${escapeRegExp(lowerTerm)}([^a-z0-9]|$)`, "i").test(lowerText);
      }
      return lowerText.includes(lowerTerm);
    })
  );
}

function extractResumeSignals(resume) {
  const signals = [];
  const lower = resume.toLowerCase();

  if (/(负责|主导|搭建|设计|推动|落地|优化|上线|交付)/.test(resume)) {
    signals.push("有明确项目动作");
  }
  if (/(提升|降低|增长|减少|节省|转化|留存|营收|效率|成本)/.test(resume)) {
    signals.push("有业务结果表达");
  }
  if (/(\d+%|\d+人|\d+万|\d+天|\d+小时|\d+个月|\d+年)/.test(resume)) {
    signals.push("有量化指标");
  }
  if (/(跨部门|协作|沟通|对齐|推进)/.test(resume)) {
    signals.push("有协作经验");
  }
  if (lower.includes("github") || lower.includes("作品集") || lower.includes("portfolio")) {
    signals.push("有作品或代码证据");
  }

  return signals.length ? signals : ["简历证据偏少，需要补充项目、指标和职责边界"];
}

function extractQuantifiedSignals(resume) {
  const matches = resume.match(/[^。\n；;]*?(\d+%|\d+人|\d+万|\d+天|\d+小时|\d+个月|\d+年)[^。\n；;]*/g) || [];
  return unique(matches.map((item) => cleanLine(item)).filter(Boolean)).slice(0, 6);
}

function calculateScore({ resume, jobDescription, matched, missing, resumeSignals, quantifiedSignals }) {
  const jdTermCount = matched.length + missing.length;
  const skillScore = jdTermCount ? (matched.length / jdTermCount) * 50 : 24;
  const signalScore = Math.min(resumeSignals.length * 7, 25);
  const metricScore = Math.min(quantifiedSignals.length * 4, 15);
  const lengthScore = resume.length > 300 && jobDescription.length > 300 ? 10 : 5;
  return Math.max(35, Math.min(96, Math.round(skillScore + signalScore + metricScore + lengthScore)));
}

function buildVerdict(score) {
  if (score >= 82) {
    return "高度匹配，可以直接投递，但仍建议把顶部摘要和项目经历按 JD 重新排序。";
  }
  if (score >= 68) {
    return "中高匹配，适合投递；需要补齐缺失关键词和量化成果来提高面试邀约率。";
  }
  if (score >= 52) {
    return "部分匹配，建议先改写简历并补充证据，再选择性投递。";
  }
  return "当前匹配度偏低，建议调整目标岗位或补充关键能力证明后再投递。";
}

function buildStrengths({ matched, resumeSignals, quantifiedSignals, roleMatches }) {
  const strengths = [];
  if (matched.length) {
    strengths.push(`已覆盖 JD 中的 ${matched.slice(0, 5).join("、")}。`);
  }
  if (roleMatches.length) {
    strengths.push(`岗位方向与 ${roleMatches.slice(0, 3).join("、")} 相关经历存在交集。`);
  }
  if (quantifiedSignals.length) {
    strengths.push("简历中已有可量化成果，可作为筛选和面试的核心证据。");
  }
  if (resumeSignals.includes("有协作经验")) {
    strengths.push("具备跨团队推进或协作表达，适合强调复杂项目落地能力。");
  }
  return strengths.length ? strengths.slice(0, 4) : ["简历已有基础信息，但需要进一步补充与 JD 直接相关的项目证据。"];
}

function buildRisks({ missing, resumeSignals, quantifiedSignals, targetRole }) {
  const risks = [];
  if (missing.length) {
    risks.push(`JD 关键词缺口：${missing.slice(0, 6).join("、")}。`);
  }
  if (!resumeSignals.includes("有量化指标") && !quantifiedSignals.length) {
    risks.push("缺少量化结果，简历容易显得像职责描述而不是成果证明。");
  }
  if (!resumeSignals.includes("有明确项目动作")) {
    risks.push("项目动作不够清晰，需要突出你主导了什么、怎么做、结果如何。");
  }
  if (targetRole === "目标岗位") {
    risks.push("目标岗位不够具体，建议填写岗位名称以提高分析准确度。");
  }
  return risks.length ? risks.slice(0, 4) : ["主要风险较少，重点是让简历顺序和语言更贴近 JD。"];
}

function selectResumeBullets(resume) {
  return resume
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length >= 12)
    .filter((line) => /[-*•]|负责|主导|参与|设计|开发|优化|运营|分析|推动|搭建|管理/.test(line))
    .slice(0, 8);
}

function cleanLine(line) {
  return String(line || "")
    .replace(/^[-*•\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bulletHasMetric(bullet) {
  return /(\d+%|\d+人|\d+万|\d+天|\d+小时|\d+个月|\d+年)/.test(bullet);
}

function rewriteBullet(bullet, matched, missing, index) {
  const primarySkill = matched[index % Math.max(matched.length, 1)] || missing[index % Math.max(missing.length, 1)] || "岗位关键能力";
  const cleaned = cleanLine(bullet).replace(/[。；;]$/, "");
  return `围绕 ${primarySkill}，${cleaned}；补充项目规模、你的具体决策和结果指标，让经历能直接回应 JD 要求。`;
}

function fallbackRewriteBullets(matched, missing) {
  const focus = matched[0] || missing[0] || "岗位关键能力";
  return [
    {
      original: "简历缺少可直接改写的项目条目。",
      issue: "输入更像概述，缺少项目、动作和结果。",
      rewrite: `新增一条项目经历：在某项目中负责 ${focus}，说明背景、行动、工具、协作对象和量化结果。`
    }
  ];
}

function buildHeadline(targetRole, matched, seniority) {
  const core = matched.slice(0, 3).join(" / ") || "业务问题拆解 / 项目交付 / 快速学习";
  const level = seniority && seniority !== "未指定" ? seniority : "候选人";
  return `${level} ${targetRole}候选人 | ${core}`;
}

function buildStrategy(score, missing, matched) {
  if (score >= 82) {
    return "直接投递，同时把最匹配的项目提前到简历第一页，并在投递备注里点名 2-3 个 JD 关键词。";
  }
  if (score >= 68) {
    return `先补齐 ${missing.slice(0, 3).join("、") || "关键能力"} 的证据，再投递同类岗位。`;
  }
  return `优先选择更贴近 ${matched.slice(0, 3).join("、") || "当前经历"} 的岗位，或用项目作品补足 JD 缺口。`;
}

function buildTailoredSummary(targetRole, matched, resumeSignals, quantifiedSignals) {
  const skills = matched.slice(0, 4).join("、") || "岗位相关能力";
  const evidence = quantifiedSignals[0] || resumeSignals.join("、");
  return `面向${targetRole}岗位，具备${skills}经验。过往经历中体现了${evidence}，适合在简历顶部强调问题拆解、执行过程和可验证结果。`;
}

function buildExperienceBullets(matched, missing, quantifiedSignals) {
  const skills = matched.length ? matched : ["岗位核心能力"];
  const bullets = skills.slice(0, 4).map((skill) => {
    const metric = quantifiedSignals.shift();
    return metric
      ? `围绕 ${skill} 交付相关项目，结合已有量化证据“${metric}”说明业务影响。`
      : `负责 ${skill} 相关任务，补充项目背景、关键动作、协作对象和结果指标。`;
  });

  if (missing.length) {
    bullets.push(`针对 JD 缺口 ${missing.slice(0, 3).join("、")}，补充学习、项目或作品集证明。`);
  }

  return bullets;
}

function buildProjectBullets(targetRole, matched, missing) {
  return [
    `项目一：选择最贴近${targetRole}的项目，突出 ${matched.slice(0, 3).join("、") || "岗位关键能力"}。`,
    "项目二：用 STAR 结构写清背景、任务、行动和结果，避免只罗列工具。",
    `补充项目：如果缺少 ${missing.slice(0, 2).join("、") || "JD 关键词"}，用作品集或练习项目补证据。`
  ];
}

function buildCoverLetter(targetRole, matched, missing, score) {
  return [
    `您好，我对${targetRole}岗位很感兴趣。基于岗位要求，我的经历与${matched.slice(0, 4).join("、") || "核心职责"}有较强关联。`,
    `我已根据 JD 梳理过相关项目，当前匹配度评估为 ${score} 分。后续沟通中，我可以重点展开项目背景、关键动作、业务结果和复盘。`,
    missing.length
      ? `对于${missing.slice(0, 3).join("、")}等能力，我也准备补充学习或项目证明，期待进一步交流。`
      : "期待有机会进一步沟通岗位目标和团队当前最重要的问题。"
  ].join("\n");
}

function buildInterviewQuestions(targetRole, matched, missing) {
  return [
    `请介绍一个最能证明你胜任${targetRole}的项目。`,
    `你在 ${matched[0] || "核心项目"} 中具体负责哪一部分？做过哪些取舍？`,
    "如果项目目标和资源冲突，你会如何排序和推进？",
    missing.length ? `JD 提到 ${missing[0]}，你目前有哪些相关经验或补足计划？` : "你如何判断一个项目是否真正产生了业务价值？",
    "你最近一次复盘失败或效果不达预期的经历是什么？"
  ];
}

function buildStarStories(matched, missing) {
  return [
    `STAR 1：围绕 ${matched[0] || "最相关能力"} 准备一个成功项目，讲清背景、目标、行动、结果。`,
    `STAR 2：围绕 ${matched[1] || "跨部门协作"} 准备一个沟通推进案例，体现冲突处理和结果落地。`,
    `STAR 3：围绕 ${missing[0] || "能力成长"} 准备一个补足短板的案例，体现学习速度和复盘能力。`
  ];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  analyze,
  responseSchema
};
