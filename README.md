# The V2EX Chronicle

V2EX 帖子评论可视化分析平台 —— 输入任意 V2EX 帖子链接，自动生成纽约时报风格的交互式分析报告。

👉 **线上体验：https://v2ex-report.vercel.app**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## 功能

- **输入任意 V2EX 帖子链接**，自动抓取并生成分析报告
- 话题分布 · 情感分析 · 活跃用户排行（带图表动画）
- AI 全文总结 · 高频问题 AI 解读
- 精华评论 · 全部评论浏览器（筛选 / 搜索 / 分页）
- 暗色模式 · 访客统计 · 点赞
- ISR + 按需刷新，数据自动保持最新

## 使用方式

1. 打开 [v2ex-report.vercel.app](https://v2ex-report.vercel.app)
2. 在顶部输入框粘贴 V2EX 帖子链接或帖子 ID（如 `1200385`）
3. 点击「分析」，等待抓取和分析完成
4. 查看生成的可视化分析报告

支持的输入格式：
- 完整链接：`https://www.v2ex.com/t/1200385`
- 帖子 ID：`1200385`

## 技术栈

- **框架**：Next.js 16 + React 19 + TypeScript
- **样式**：Tailwind CSS 4 + Framer Motion + next-themes
- **数据抓取**：r.jina.ai（Markdown 模式）
- **存储**：Vercel Blob
- **部署**：Vercel（Hobby 计划即可）
- **数据更新**：ISR（1 小时缓存） + 按需后台刷新 + Cron 每日全量更新

## 本地开发

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
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

## 部署到 Vercel

1. Push 到 GitHub → [vercel.com](https://vercel.com) 导入 → Deploy
2. 创建 Blob Store 并关联到项目
3. 添加环境变量：`CRON_SECRET`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`

## License

[MIT](LICENSE)
