# AI 简历求职 Agent

一个可运行的简历与求职 Agent MVP。用户粘贴简历和岗位 JD 后，系统会输出匹配度、关键词差距、简历改写、定制简历摘要、面试准备和投递行动计划。

## 解决的痛点

- 求职者不知道自己的简历和岗位 JD 匹配在哪里。
- 同一份简历反复投递，缺少针对岗位的关键词和成果表达。
- 不会把经历改写成“场景、动作、结果”的可面试材料。
- 面试前没有围绕岗位准备 STAR 案例和追问问题。

## 核心逻辑流

```text
粘贴简历和 JD
  ↓
Agent 提取岗位关键词和简历证据
  ↓
计算匹配度，识别优势和风险
  ↓
生成简历改写建议和定制摘要
  ↓
生成面试问题、STAR 素材和投递行动计划
  ↓
输出可直接复制的求职材料
```

## 运行方式

```bash
cd C:\Users\zhang\ai-job-agent
npm run local
```

浏览器打开：

```text
http://localhost:3000
```

## AI Provider

项目支持三种后端模式：

```text
local   -> 项目内置规则引擎，不调用第三方模型
openai  -> OpenAI Responses API
nvidia  -> NVIDIA NIM OpenAI-compatible Chat Completions API
```

不配置任何 API Key 时，项目自动使用 `local`，方便演示完整流程。

### OpenAI

```powershell
$env:AI_PROVIDER="openai"
$env:OPENAI_API_KEY="你的 OpenAI API Key"
$env:OPENAI_MODEL="gpt-4.1-mini"
npm start
```

### NVIDIA NIM

```powershell
$env:AI_PROVIDER="nvidia"
$env:NVIDIA_API_KEY="你的 NVIDIA API Key"
$env:NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
$env:NVIDIA_MODEL="meta/llama-3.1-70b-instruct"
$env:NVIDIA_TIMEOUT_MS="25000"
$env:NVIDIA_MAX_TOKENS="2048"
npm run local
```

NVIDIA 的模型 ID 建议以 NVIDIA API Catalog 页面里复制到的值为准。

## Vercel 部署

项目已准备好 Vercel 部署结构：

```text
public/              # 静态前端
api/analyze.js       # Vercel Serverless Function
lib/agent.js         # Agent 分析逻辑和 provider 适配
vercel.json          # Vercel 函数配置
```

部署：

```bash
npx vercel --prod
```

线上使用 NVIDIA 时，在 Vercel Project Settings -> Environment Variables 配置：

```text
AI_PROVIDER=nvidia
NVIDIA_API_KEY=你的 NVIDIA API Key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=你选择的 NVIDIA 模型 ID
NVIDIA_TIMEOUT_MS=25000
NVIDIA_MAX_TOKENS=2048
```

不要把真实 API Key 写进代码、README、`.env.example` 或前端文件。

## 项目结构

```text
ai-job-agent
├─ api
│  └─ analyze.js          # Vercel Serverless API
├─ lib
│  └─ agent.js            # Provider 选择、OpenAI/NVIDIA 调用、本地规则引擎
├─ package.json
├─ .env.example
├─ vercel.json
├─ scripts
│  └─ local-server.js     # Node 原生本地 HTTP 服务
└─ public
   ├─ index.html          # 输入和报告界面
   ├─ styles.css          # 响应式 UI
   └─ app.js              # 前端交互和报告渲染
```

## 后续可扩展

- 增加 PDF / DOCX 简历解析。
- 增加岗位收藏和多版本简历管理。
- 接入投递记录、面试日程和跟进提醒。
- 为不同行业增加关键词库和评分权重。
- 增加账号系统，把每次分析沉淀为候选人的求职记忆。
