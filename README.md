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
node server.js
```

浏览器打开：

```text
http://localhost:3000
```

## 可选 OpenAI 接入

不配置 API Key 时，项目使用内置本地规则引擎，方便演示完整流程。

如果要接入真实模型：

```powershell
$env:OPENAI_API_KEY="你的 API Key"
$env:OPENAI_MODEL="gpt-4.1-mini"
node server.js
```

后端使用 OpenAI Responses API 的 `POST /v1/responses` 形态，并要求模型返回固定 JSON 结构。模型名通过 `OPENAI_MODEL` 配置，便于后续替换。

## 部署

项目已准备好 Vercel 部署结构：

```text
public/              # 静态前端
api/analyze.js       # Vercel Serverless Function
lib/agent.js         # 前后端部署共用的 Agent 分析逻辑
vercel.json          # Vercel 函数配置
```

如果已经登录 Vercel CLI，可以直接执行：

```bash
npx vercel --prod
```

如果要让线上实例使用真实模型，在 Vercel 项目环境变量里配置：

```text
OPENAI_API_KEY=你的 API Key
OPENAI_MODEL=gpt-4.1-mini
```

不配置 `OPENAI_API_KEY` 时，线上实例仍会使用本地规则引擎完成 Demo 分析。

## 项目结构

```text
ai-job-agent
├─ api
│  └─ analyze.js          # Vercel Serverless API
├─ lib
│  └─ agent.js            # OpenAI 调用、本地分析引擎、报告结构
├─ server.js              # Node 原生本地 HTTP 服务
├─ package.json
├─ .env.example
├─ vercel.json
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
