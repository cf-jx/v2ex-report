# V2EX Report 免费托管优化记录

## 原因

旧 Vercel 版本在每次页面加载时读取一次 Blob 点赞文件。账单快照中，Blob Simple Operations 为 `95,240 / 10,000`，同时约有 `105K` Edge Requests 和 `94K` Function Invocations。点赞不是产品目标，因此不再保留这条高频读路径。

## 最终架构

- 托管：Cloudflare Pages 纯静态文件
- 构建：Next.js static export
- 数据源：V2EX 官方 JSON API
- 更新：GitHub Actions 每小时执行 `npm run refresh-data`
- 前端新鲜度：每页最多读取一次 GitHub 原始 JSON，只接受 `lastFetched` 更新且帖子 ID 匹配的数据
- 持久化：仓库内的 `src/data/posts/*.json`

页面运行时不需要 Worker、D1、KV、Vercel Function 或 Blob。

## 已删除

- 帖子点赞及 IP 记录
- FAQ 赞踩
- 访客计数和实时探针
- 自动轮询和页面触发刷新
- 运行时 AI 总结与生成接口
- 所有 `/api/*` 路由
- Vercel Blob、Cloudflare D1/KV 运行时代码

## 请求模型

- 普通页面访问：Cloudflare Pages 静态资源请求
- 新鲜度检查：最多 1 次公开 GitHub JSON GET，不写入任何数据
- 后台更新：GitHub Actions 每小时 1 次，直接调用 V2EX 官方接口
- 无页面访问时：托管平台不执行计算任务

## 数据完整性

- 刷新前核对 topic ID、删除状态和作者
- 回复数组数量必须与 V2EX topic 的 `replies` 完全一致
- 当前支持最多 1,000 条回复，超过时明确失败
- 刷新失败时脚本不会覆盖旧 JSON
- 页面只接受同一帖子且 `lastFetched` 更晚的远程快照

## 验证清单

1. `npm run refresh-data`
2. `npm run lint`
3. `npm run build`
4. `npm audit --omit=dev`
5. 部署到 Cloudflare Pages
6. 在 Chrome 验证首页、报告页、海报页和暗色模式
7. 确认网络请求中没有 `/api/*`、点赞或投票请求

旧 Vercel Blob、旧 Cloudflare Worker、KV 和 D1 资源没有自动删除，避免误删历史数据；确认不再需要后可单独清理。
