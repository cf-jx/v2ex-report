# V2EX Report 站点优化计划

## Context

站点已上线运行，核心功能完整。本次优化聚焦于：SEO/社交分享、死代码清理、数据新鲜度、以及小的 UX 改进。

---

## 优化项（按优先级排序）

### 1. SEO & Open Graph 元数据（高优）
**问题**：`layout.tsx` 只有最基础的 title/description，缺少 Open Graph、Twitter Card。分享到 X/微信时无预览图和摘要。
**改动文件**：`src/app/layout.tsx`
**内容**：
- 添加 `og:title`, `og:description`, `og:image`, `og:url`
- 添加 `twitter:card`, `twitter:title`, `twitter:description`
- description 改为中文，描述帖子内容
- 添加 `keywords` meta

### 2. 删除死代码（高优）
**问题**：`RegenerateFAQButton.tsx` 和 `CollapsibleSection.tsx` 已无任何地方引用，是死文件。
**改动**：删除以下文件：
- `src/components/interactive/RegenerateFAQButton.tsx`
- `src/components/interactive/CollapsibleSection.tsx`

### 3. Cron 数据更新实际生效（高优）
**问题**：`data.ts` 用静态 `import()` 读打包时的 JSON，Cron 写到 `/tmp` 后页面读不到新数据，自动更新形同虚设。
**改动文件**：`src/lib/data.ts`, `src/app/page.tsx`
**方案**：将 `page.tsx` 改为 `dynamic = "force-dynamic"`，`data.ts` 用 `readFileSync` 先查 `/tmp` 再 fallback 到打包数据。这样 Cron 更新 + `revalidatePath("/")` 后，下次请求就能读到新数据。

### 4. 帖子原文摘要区域（中优）
**问题**：报告页只有评论数据，没有 OP 原帖内容的任何展示。首次访问的用户不知道帖子讲什么。
**改动文件**：`src/app/page.tsx`
**方案**：在 Header 下方 StatCard 上方，加一个简短的帖子摘要（2-3 行），配一个"查看原帖"链接，让读者知道这个帖子是关于什么的。

### 5. 页面加载骨架屏（中优）
**问题**：客户端组件（AISummary、LikeButton、VisitorCounter）在 hydrate 前会闪空白。
**改动文件**：`src/app/loading.tsx`（新建）
**方案**：添加 Next.js loading.tsx 提供简单的骨架屏过渡。

### 6. 移动端微调（低优）
**问题**：`AnimatedBarChart` 标签 `w-28 sm:w-36` 在小屏可能截断中文话题名。
**改动文件**：`src/components/charts/AnimatedBarChart.tsx`
**方案**：小屏时标签换行或缩小字号。

---

## 不做的事

- 不换存储方案（保持 JSON file + /tmp）
- 不加 PWA / Service Worker
- 不重构组件结构

## 验证

1. `npm run build` 通过
2. 本地 `npm start` 检查 HTML head 的 meta 标签
3. `git push` → Vercel 自动部署
4. Open Graph 预览检查
