# The V2EX Chronicle

V2EX 帖子评论可视化报告，采用纽约时报风格呈现话题、情感、活跃用户和评论数据。

线上地址：[https://v2ex-chronicle.pages.dev](https://v2ex-chronicle.pages.dev)

## 功能

- 展示已发布帖子的完整评论分析报告
- 话题分布、情感分析、活跃用户排行
- 精华评论、评论搜索与分页
- 历史 FAQ 分析快照
- 暗色模式和海报导出
- 基础评论数据每小时自动刷新

当前只发布帖子 `1200385`。输入其他帖子链接时会明确提示“该帖子尚未发布分析报告”，不会在访问时启动后台生成任务。

## 免费架构

- Next.js 16 使用 `output: "export"` 生成纯静态文件
- Cloudflare Pages 负责静态托管
- GitHub Actions 每小时调用一次 V2EX 官方 JSON API
- 更新后的报告写入 `src/data/posts/*.json`
- 浏览器最多读取一次 GitHub 上的公开 JSON，并只采用时间更新的数据

线上没有 Worker、Serverless Function、数据库、点赞、投票、访问计数、AI 接口或轮询任务。普通访问只请求静态资源，不产生后端读写额度。

## 本地开发

```bash
git clone https://github.com/cf-jx/v2ex-report.git
cd v2ex-report
npm install
npm run dev
```

手动刷新报告：

```bash
npm run refresh-data
```

指定已配置的帖子 ID：

```bash
npm run refresh-data -- 1200385
```

刷新脚本会在写入前校验 V2EX 返回的回复数量；数据不完整时保留旧报告并以失败状态退出。

## 构建与部署

```bash
npm run lint
npm run build
npx wrangler pages project create v2ex-chronicle --production-branch master
npm run deploy
```

Cloudflare Pages 项目只需创建一次。`.github/workflows/refresh-reports.yml` 合并到默认分支后，会在每小时第 17 分钟自动更新报告；也可从 GitHub Actions 手动触发。

## License

[MIT](LICENSE)
