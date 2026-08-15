# 安心清单

个人任务清单：随手记下，安心不慌。移动优先的 PWA，电脑手机自动同步，每天早上 8 点微信提醒。

## 使用

- 网页地址：https://garcia20040629-wdy.github.io/anxin-list/
- 手机：Chrome 打开 → 登录 → 菜单"安装应用/添加到主屏幕"

## 架构

- 前端：Vue 3 + Vite + vite-plugin-pwa，托管在 GitHub Pages（gh-pages 分支）
- 数据：Supabase（Postgres + RLS），tasks 表结构见 `sql/schema.sql`
- 部署：push 到 main 自动构建部署（`.github/workflows/deploy.yml`）
- 每日提醒：Supabase 内 pg_cron 定时（`sql/reminder.sql`，北京时间 8:00），通过 Server酱推送微信；GH Actions 的 daily-reminder 仅作手动测试
- 保活：`.github/workflows/keep-alive.yml` 每天 ping 一次 Supabase，防免费层 7 天暂停

## 维护备忘

- 数据库结构改动：更新 `sql/schema.sql` 并在 Supabase SQL Editor 执行
- 需要的 GitHub Secrets：`SUPABASE_SERVICE_KEY`、`SERVERCHAN_SENDKEY`
- `.env` 里只有公开信息（Supabase URL 和 anon key），可以安全提交
- 修改图标：改 `scripts/make-icons.cjs` 里的 SVG，运行 `npm run icons`
