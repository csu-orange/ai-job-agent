const form = document.querySelector("#agentForm");
const resumeInput = document.querySelector("#resume");
const jdInput = document.querySelector("#jobDescription");
const roleInput = document.querySelector("#targetRole");
const seniorityInput = document.querySelector("#seniority");
const runButton = document.querySelector("#runButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const result = document.querySelector("#result");
const emptyState = document.querySelector("#emptyState");
const scoreValue = document.querySelector("#scoreValue");
const verdict = document.querySelector("#verdict");
const strategy = document.querySelector("#strategy");
const tabBody = document.querySelector("#tabBody");
const tabs = document.querySelectorAll(".tab");
const steps = document.querySelectorAll("#steps span");
const engineStatus = document.querySelector("#engineStatus");

let activeTab = "overview";
let currentReport = null;

const sampleResume = `张三 | 中级前端开发工程师
3 年 Web 前端经验，熟悉 React、TypeScript、Node.js、Git、CI/CD。

工作经历
- 负责 B 端 SaaS 数据看板重构，使用 React + TypeScript 拆分组件和状态管理，页面加载时间降低 38%。
- 主导表单配置平台建设，沉淀 20+ 个可复用组件，支持运营同学自助配置活动页。
- 参与 Node.js 中间层开发，封装订单、客户、权限相关接口，减少前后端联调时间。
- 与产品、设计、后端跨部门协作，推动需求评审、排期和上线复盘。

项目经历
- CRM 客户分析模块：负责筛选器、图表联动、权限展示，支持 5 个销售团队使用。
- 性能优化专项：通过路由懒加载、缓存和包体积分析，将首屏时间从 4.2 秒降到 2.6 秒。`;

const sampleJd = `岗位：前端开发工程师
职责：
1. 负责 B 端 SaaS 产品的前端开发和体验优化。
2. 与产品、设计、后端协作，推进需求落地和持续迭代。
3. 参与前端工程化、组件库建设和性能优化。

要求：
1. 熟悉 JavaScript、TypeScript、React，有大型业务项目经验。
2. 熟悉 Node.js 或前后端联调流程，理解接口设计。
3. 有组件库、数据可视化、性能优化经验优先。
4. 具备良好的沟通能力、项目推进能力和结果意识。`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAgent();
});

sampleButton.addEventListener("click", () => {
  roleInput.value = "前端开发工程师";
  seniorityInput.value = "中级";
  resumeInput.value = sampleResume;
  jdInput.value = sampleJd;
});

clearButton.addEventListener("click", () => {
  form.reset();
  currentReport = null;
  result.hidden = true;
  emptyState.hidden = false;
  engineStatus.textContent = "本地分析引擎";
  setSteps(0);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.tab;
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    renderTab();
  });
});

async function runAgent() {
  const payload = {
    targetRole: roleInput.value.trim(),
    seniority: seniorityInput.value,
    resume: resumeInput.value.trim(),
    jobDescription: jdInput.value.trim()
  };

  if (payload.resume.length < 30 || payload.jobDescription.length < 30) {
    showNotice("请至少输入 30 个字符的简历内容和岗位 JD。");
    return;
  }

  runButton.disabled = true;
  runButton.textContent = "分析中...";
  emptyState.hidden = true;
  result.hidden = false;
  setSteps(1);
  tabBody.innerHTML = '<div class="notice">Agent 正在提取关键词、评估匹配度并生成求职策略。</div>';

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "分析失败");
    }

    currentReport = data;
    scoreValue.textContent = Math.round(data.summary.matchScore);
    verdict.textContent = data.summary.verdict;
    strategy.textContent = data.summary.recommendedStrategy;
    engineStatus.textContent = buildEngineLabel(data.engine);
    setSteps(4);
    renderTab();
  } catch (error) {
    showNotice(error.message || "分析失败，请稍后重试。");
    setSteps(0);
  } finally {
    runButton.disabled = false;
    runButton.textContent = "运行分析";
  }
}

function renderTab() {
  if (!currentReport) {
    return;
  }

  const warning = currentReport.warning ? `<div class="notice">${escapeHtml(currentReport.warning)}</div>` : "";

  if (activeTab === "overview") {
    tabBody.innerHTML =
      warning +
      section("优势匹配", list(currentReport.summary.strongestFit)) +
      section("主要风险", list(currentReport.summary.mainRisks, "warning")) +
      section("命中关键词", chips(currentReport.keywordFit.matched)) +
      section("缺失关键词", chips(currentReport.keywordFit.missing, "missing")) +
      section("Agent 执行轨迹", trace(currentReport.agentTrace));
    return;
  }

  if (activeTab === "rewrite") {
    tabBody.innerHTML =
      warning +
      section("定位策略", textBlock(currentReport.rewritePlan.positioning)) +
      section("经历改写", rewriteItems(currentReport.rewritePlan.bulletsToImprove)) +
      section("关键词补齐", list(currentReport.rewritePlan.keywordGaps));
    return;
  }

  if (activeTab === "tailored") {
    tabBody.innerHTML =
      warning +
      section("标题", textBlock(currentReport.tailoredResume.headline)) +
      section("简历摘要", textBlock(currentReport.tailoredResume.summary)) +
      section("核心能力", chips(currentReport.tailoredResume.coreSkills)) +
      section("经历要点", list(currentReport.tailoredResume.experienceBullets)) +
      section("项目要点", list(currentReport.tailoredResume.projectBullets));
    return;
  }

  if (activeTab === "interview") {
    tabBody.innerHTML =
      warning +
      section("高频面试题", list(currentReport.interview.likelyQuestions)) +
      section("STAR 素材", list(currentReport.interview.starStories)) +
      section("反问问题", list(currentReport.interview.questionsToAsk));
    return;
  }

  tabBody.innerHTML =
    warning +
    section("下一步行动", list(currentReport.applicationPlan.nextActions)) +
    section("投递跟进话术", textBlock(currentReport.applicationPlan.followUpMessage)) +
    section("求职信草稿", textBlock(currentReport.coverLetter));
}

function setSteps(count) {
  steps.forEach((step, index) => {
    step.classList.toggle("active", index < count);
  });
}

function section(title, content) {
  return `<section class="section"><h3>${escapeHtml(title)}</h3>${content}</section>`;
}

function list(items, className = "") {
  const safeItems = Array.isArray(items) && items.length ? items : ["暂无"];
  return `<ul class="list ${className}">${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function chips(items, className = "") {
  const safeItems = Array.isArray(items) && items.length ? items : ["暂无"];
  return `<div class="chips">${safeItems.map((item) => `<span class="chip ${className}">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function rewriteItems(items) {
  const safeItems = Array.isArray(items) && items.length ? items : [];
  return safeItems
    .map(
      (item) => `
        <article class="rewrite-item">
          <p><b>原句：</b>${escapeHtml(item.original)}</p>
          <p><b>问题：</b>${escapeHtml(item.issue)}</p>
          <p><b>改写：</b>${escapeHtml(item.rewrite)}</p>
        </article>
      `
    )
    .join("");
}

function trace(items) {
  const safeItems = Array.isArray(items) && items.length ? items : [];
  return `<ul class="list">${safeItems
    .map((item) => `<li><b>${escapeHtml(item.step)}</b> · ${escapeHtml(item.status)}<br>${escapeHtml(item.detail)}</li>`)
    .join("")}</ul>`;
}

function textBlock(value) {
  return `<div class="text-block">${escapeHtml(value || "暂无")}</div>`;
}

function showNotice(message) {
  emptyState.hidden = true;
  result.hidden = false;
  scoreValue.textContent = "--";
  verdict.textContent = "无法完成分析";
  strategy.textContent = "";
  tabBody.innerHTML = `<div class="notice">${escapeHtml(message)}</div>`;
}

function buildEngineLabel(engine) {
  if (engine === "openai") {
    return "OpenAI Agent";
  }
  if (engine === "local-fallback") {
    return "本地兜底引擎";
  }
  return "本地分析引擎";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
