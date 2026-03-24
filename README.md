# The V2EX Chronicle

V2EX 帖子评论可视化报告系统 —— 报纸编辑风格的交互式数据报告。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-ff69b4)
![License](https://img.shields.io/badge/License-MIT-green)

## 项目简介

将 V2EX 帖子的评论数据，以 **纽约时报 / 经济学人** 报纸编辑风格呈现为一份精美的交互式可视化报告。支持暗色/亮色主题切换、多维度数据筛选、滚动动画、AI FAQ 问答卡片等功能。

当前报告帖子：[「教程揭秘向」扒完中转站掺假，再扒低价代充——顺便教你自己订阅 Claude/ChatGPT](https://www.v2ex.com/t/1200385)

## 功能特性

### 数据可视化
- **关键指标卡片** — 总回复数、活跃用户数、OP 回复率、收藏数，带数字从 0 跳动的计数动画
- **话题分布柱状图** — 8 大话题分类（封号风控、Google Play、VPN 节点等），滚动触发动画
- **情感分析** — 堆叠情感条 + 甜甜圈饼图，积极/中立/消极三色可视化
- **活跃用户 TOP 10** — 柱状图排名，OP 红色高亮标注

### 交互功能
- **话题筛选** — 横向滚动标签云，多选切换，动画缩放反馈
- **情感筛选** — 积极/中立/消极三按钮，带彩色圆点指示
- **全文搜索** — 300ms 防抖输入，关键词黄色高亮
- **评论分页** — 每页 20 条，"加载更多"按钮
- **折叠展开** — FAQ 卡片和评论区段可折叠/展开
- **暗色/亮色切换** — 右上角主题切换按钮，localStorage 持久化，无 FOUC 闪烁

### AI FAQ 解读
基于 162 条评论提炼的 **8 个高频问题**，每个卡片包含：
- 问题标题 + 相关讨论数量
- AI 解读摘要（始终可见）
- OP 原话引用（点击展开）

### 自动更新
- Vercel Cron 每日 8:00 UTC 自动抓取最新评论
- 通过 r.jina.ai 抓取 → 关键词分类 → 情感分析 → 更新 JSON 数据
- ISR 自动刷新页面，无需手动重新部署

## 设计系统

### 排版
| 用途 | 字体 |
|------|------|
| 英文标题 | Playfair Display (serif) |
| 中文标题 | Noto Serif SC |
| 正文 | Inter / Noto Sans SC |
| 数据数字 | JetBrains Mono |

### 配色

**亮色主题:**
- 背景: `#FAFAF5`（暖白，新闻纸质感）
- 正文: `#1A1A1A`
- 强调: `#C41E3A`（NYT red）
- 数据色: `#264653` `#2A9D8F` `#E9C46A` `#F4A261` `#E76F51`

**暗色主题:**
- 背景: `#121212`
- 正文: `#E8E8E3`
- 强调: `#FF4D6A`

### 布局元素
- 报纸 masthead 风格头部，双线分隔符
- 多栏响应式布局（FAQ 卡片桌面端 2 列）
- Pull quote 引用块样式
- 细线分隔各内容区域

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 (App Router) | 框架，SSG + API Routes |
| Tailwind CSS 4 | 样式，CSS 变量主题 |
| Framer Motion | 滚动触发动画、计数动画、折叠展开 |
| next-themes | 暗色/亮色主题切换 |
| lucide-react | 图标 |
| r.jina.ai | 网页抓取（Markdown 转换） |
| Vercel Cron | 每日自动更新 |

## 项目结构

```
v2ex-report/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root 布局：字体、主题
│   │   ├── page.tsx                      # 报告主页（Server Component）
│   │   ├── globals.css                   # CSS 变量 + Tailwind 主题
│   │   └── api/cron/update/route.ts      # Cron 自动更新 API
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ReportHeader.tsx          # 报纸 masthead 头部
│   │   │   └── ThemeToggle.tsx           # 暗亮切换按钮
│   │   ├── charts/
│   │   │   ├── AnimatedBarChart.tsx      # 柱状图（滚动触发）
│   │   │   ├── AnimatedPieChart.tsx      # 甜甜圈饼图
│   │   │   └── SentimentGauge.tsx        # 情感堆叠条
│   │   ├── cards/
│   │   │   ├── StatCard.tsx              # 数据指标卡片
│   │   │   ├── FAQCard.tsx               # AI 问答卡片
│   │   │   └── HotCommentCard.tsx        # 精华评论卡片
│   │   └── interactive/
│   │       ├── CommentFilter.tsx          # 话题/情感筛选
│   │       ├── CommentList.tsx            # 评论列表（集成搜索+筛选+分页）
│   │       ├── SearchBar.tsx              # 全文搜索
│   │       ├── ScrollReveal.tsx           # 滚动淡入动画
│   │       └── CollapsibleSection.tsx     # 折叠展开
│   ├── lib/
│   │   ├── types.ts                      # TypeScript 类型定义
│   │   ├── data.ts                       # 数据加载
│   │   ├── scraper.ts                    # r.jina.ai 抓取
│   │   └── analyzer.ts                   # 话题分类 / 情感分析
│   └── data/
│       └── posts/
│           ├── 1200385.json              # 结构化评论数据
│           └── 1200385-faq.json          # FAQ 卡片数据
├── scripts/
│   └── seed.ts                           # 初始数据抓取脚本
├── vercel.json                           # Cron 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/cf-jx/v2ex-report.git
cd v2ex-report

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开 http://localhost:3000
```

### 构建生产版本

```bash
npm run build
npm start
```

### 重新抓取数据

```bash
npx tsx scripts/seed.ts 1200385
```

## 部署到 Vercel

### 方式一：GitHub 关联（推荐）

1. Fork 或 push 本仓库到你的 GitHub
2. 打开 [vercel.com](https://vercel.com)，点击 **New Project**
3. 导入 GitHub 仓库，Framework Preset 选 **Next.js**
4. 添加环境变量 `CRON_SECRET`（用 `openssl rand -hex 32` 生成）
5. 点击 **Deploy**

后续每次 `git push` 会自动触发部署。

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 环境变量

| 变量 | 必须 | 说明 |
|------|------|------|
| `CRON_SECRET` | 是 | Cron API 鉴权密钥，防止未授权调用 |

在 Vercel 控制台设置：**Settings → Environment Variables → 添加 `CRON_SECRET`**

## 自动更新机制

```
Vercel Cron (每天 08:00 UTC)
  → GET /api/cron/update (验证 CRON_SECRET)
    → r.jina.ai 抓取 V2EX 帖子最新评论
    → 关键词话题分类 + 情感分析
    → 更新 JSON 数据文件
    → ISR revalidate 刷新页面
```

Vercel Hobby（免费）计划支持每天 1 次 Cron。

## 适配其他帖子

1. 修改 `src/app/page.tsx` 中的 `POST_ID` 常量
2. 运行 seed 脚本重新抓取：

```bash
npx tsx scripts/seed.ts <帖子ID>
```

3. FAQ 数据需要手动编辑 `src/data/posts/<帖子ID>-faq.json`

## 贡献指南

欢迎参与贡献！无论是修复 Bug、改善文档还是添加新功能，我们都非常感谢。

### 如何贡献

1. **Fork** 本仓库
2. 创建你的功能分支：`git checkout -b feature/my-feature`
3. 提交你的修改：`git commit -m "feat: add some feature"`
4. 推送到远程分支：`git push origin feature/my-feature`
5. 创建一个 **Pull Request**

### 开发规范

- **代码风格** — 遵循项目已有的 ESLint 配置，提交前确保 `npm run lint` 无报错
- **Commit 规范** — 使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：
  - `feat:` 新功能
  - `fix:` 修复 Bug
  - `docs:` 文档更新
  - `style:` 样式调整（不影响逻辑）
  - `refactor:` 重构
  - `perf:` 性能优化
- **组件开发** — 新组件放在对应的 `components/` 子目录下，遵循现有的命名和结构
- **类型安全** — 所有新代码必须通过 TypeScript 类型检查

### 可以贡献的方向

- [ ] 支持更多 V2EX 帖子（通用化帖子 ID 配置）
- [ ] 添加评论时间线视图
- [ ] 评论关系网络图（谁回复了谁）
- [ ] 用户画像分析卡片
- [ ] 导出 PDF 报告功能
- [ ] 移动端手势交互优化
- [ ] i18n 国际化支持
- [ ] 接入 LLM API 自动生成 FAQ 解读
- [ ] 支持 Cloudflare Pages 部署

### 报告 Bug

如果你发现了 Bug，请在 [Issues](https://github.com/cf-jx/v2ex-report/issues) 中提交，并包含以下信息：
- 你的操作系统和浏览器版本
- 复现步骤
- 期望行为 vs 实际行为
- 相关截图（如有）

## 许可证

[MIT](LICENSE)
