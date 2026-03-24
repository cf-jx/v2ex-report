# The V2EX Chronicle

V2EX 帖子评论可视化报告 —— 报纸编辑风格，全程用 Claude Code 生成，一行代码没手写。

👉 **线上预览：https://v2ex-report.vercel.app**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## 这是什么

把一个 V2EX 帖子的 180 条评论，做成一份 **纽约时报风格** 的交互式可视化报告：

- 话题分布 · 情感分析 · 活跃用户排行（带图表动画）
- AI 全文总结 · 高频问题 AI 解读（豆包 ARK API）
- 精华评论 · 全部评论浏览器（筛选 / 搜索 / 分页）
- 暗色模式 · 访客统计 · 点赞
- Vercel Cron 每日自动抓取更新

当前帖子：[「教程揭秘向」扒完中转站掺假，再扒低价代充](https://www.v2ex.com/t/1200385)

## 技术栈

Next.js 16 + Tailwind CSS 4 + Framer Motion + next-themes + r.jina.ai + Vercel Cron

## 快速开始

```bash
git clone https://github.com/cf-jx/v2ex-report.git
cd v2ex-report
npm install
npm run dev
```

AI 功能需在 `.env.local` 配置：

```
AI_API_KEY=your-key
AI_BASE_URL=https://your-api-endpoint
AI_MODEL=your-model
```

## 部署

1. Push 到 GitHub → [vercel.com](https://vercel.com) 导入 → Deploy
2. 添加环境变量：`CRON_SECRET`（`openssl rand -hex 32`）、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`

## 换成其他帖子

```bash
# 修改 src/app/page.tsx 中的 POST_ID，然后：
npx tsx scripts/seed.ts <帖子ID>
```

## License

[MIT](LICENSE)
