# 阿鸭的随笔

> 线上地址：https://73nuts.github.io/flomo-site/

一个私人随笔静态展示站，内容来自 flomo 笔记，按标签分组，按时间流式呈现。不是产品页，不是博客，是一个慢慢写、慢慢读的页面。

---

## 技术栈

| 层 | 选型 | 为什么 |
|---|---|---|
| 框架 | Astro 5 | 岛屿架构，默认 0 JS，构建时 SSG |
| 岛屿组件 | Svelte 5 (runes) | 比 React/Preact 更小更快 |
| 数据层 | Content Collections + Zod | 每条 memo 一个 .md 文件，类型安全 |
| 样式 | 原生 CSS + 设计 tokens | 不引入 Tailwind，保留手写控制力 |
| 字体 | @fontsource 自托管 | 避开 Google Fonts，国内访问稳 |
| 同步 | scripts/sync.ts (Bun) | flomo HTML → md 文件 |
| 部署 | GitHub Pages + Actions | push master 即自动上线 |
| 包管理 | pnpm | 快 |

---

## 目录结构

```
flomo-site/
├── src/
│   ├── content/
│   │   ├── config.ts                Zod schema 定义 frontmatter
│   │   └── memos/{jg,ds,qh,gd,wa}/*.md   每条 memo 独立 .md
│   ├── layouts/
│   │   └── Base.astro               html 壳 + 字体 + 视图过渡
│   ├── components/
│   │   ├── TabCard.astro            入口便签（零 JS）
│   │   ├── MemoCard.astro           列表卡片（零 JS）
│   │   ├── MonthSeparator.astro     月份分隔（零 JS）
│   │   ├── MemoBody.astro           正文渲染（零 JS）
│   │   └── islands/
│   │       ├── SkyBanner.svelte     列表页顶部天色（随系统时间）
│   │       ├── LongMemo.svelte      长文折叠
│   │       ├── ReaderNav.svelte     阅读页翻页（键盘/滑动）
│   │       └── VisitCounter.svelte  访问计数（localStorage）
│   ├── pages/
│   │   ├── index.astro              /
│   │   ├── [tab]/index.astro        /jg /ds /qh /gd /wa 列表页
│   │   └── [tab]/[slug].astro       /jg/jg0 等 746 个独立阅读页
│   ├── lib/
│   │   ├── tabs.ts                  5 个标签的配置（单一真源）
│   │   ├── date.ts                  日期格式化
│   │   ├── sky.ts                   skyFromHour 工具
│   │   └── url.ts                   base 前缀 URL 助手
│   ├── styles/theme.css             设计 tokens
│   └── env.d.ts
├── scripts/sync.ts                  flomo HTML → md
├── public/avatar.jpg
├── data/deleted.txt                 永久跳过列表（删除保护）
├── .github/workflows/deploy.yml     CI 部署
├── astro.config.mjs                 Astro 配置（含 base: '/flomo-site'）
├── tsconfig.json
└── package.json
```

---

## 5 个标签

| id | 名称        | accent   | 源目录                                  |
|----|-------------|----------|-----------------------------------------|
| jg | 吉光片羽    | #c9a063  | `~/Documents/flomo-sync/jiguang/`       |
| ds | 读书笔记    | #8a9aa8  | `~/Documents/flomo-sync/dushu/`         |
| qh | 阿鸭情话    | #c77f8a  | `~/Documents/flomo-sync/qinghua/`       |
| gd | 浮一大白    | #b88660  | `~/Documents/flomo-sync/gd/`            |
| wa | 晚安计划    | #7a8aa0  | `~/Documents/flomo-sync/wa/`            |

改名 / 换色 / 增减：动 `src/lib/tabs.ts` 一处即可。
（增加 tab 还需在 `src/content/config.ts` 的 Zod enum 里加 id，并在入口页布局上预留位。）

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 本地开发，热更新 |
| `pnpm build` | 生产构建到 `dist/` |
| `pnpm preview` | 预览生产构建 |
| `pnpm sync` | 从 `FLOMO_SYNC_DIR` 拉 flomo HTML 生成 md |
| `pnpm new` | 交互式写一条 `source: manual` 新笔记（不走 flomo） |
| `pnpm check` | 类型 + Astro 诊断 |

---

## 日常发布流程

```bash
# 1. flomo 重新导出，把 HTML 放到 ~/Documents/flomo-sync/<tab>/阿鸭的笔记.html
# 2. 一条命令搞定
cd ~/flomo-site && pnpm sync && git add -A && git commit -m "data: $(date +%m-%d)" && git push
```

GitHub Actions 检测到 master push 自动触发 `pnpm install` → `pnpm build` → 部署到 Pages。通常 2-3 分钟后线上生效。

---

## 手工条目（vault 长文 / manual）

除了 flomo 同步的短随笔，支持手工插入任何 tab 下的条目——比如 `~/vault/` 里的长文。

**机制**：每条 md 的 frontmatter 有 `source` 字段：
- `flomo`（默认）：由 `pnpm sync` 从 flomo HTML 生成，每次 sync 会重写
- `vault`：手工从 Obsidian vault 搬运的长文，sync **不会动**
- `manual`：完全手写的条目，同样 sync **不会动**

**添加一条手工条目**（以 vault 长文为例）：

```bash
# 文件名：任意稳定 slug，例如 essay-xxx.md
# 放在对应 tab 目录下
vim src/content/memos/jg/essay-my-essay.md
```

frontmatter 模板：

```yaml
---
id: "essay-my-essay"            # 必须唯一，会成为 URL 的 slug
tab: "jg"                        # 所属 tab
date: "2026-04-24"               # 决定列表排序位置
time: "09:30"                    # 可选
title: "我的长文标题"             # 可选，有 title 会在列表/阅读页顶部突出显示
source: "vault"                  # 关键：保护不被 sync 覆盖
tags: ["长文"]                   # 可选
---

这里是正文，支持完整 markdown：#/##/### 标题、有序/无序列表、**粗体**、[链接](https://...)、引用、分隔线等。
```

URL 自动为 `/jg/essay-my-essay`。

---

## 删除保护

**问题**：flomo 重新导出时会包含之前已从展示站删除的条目（比如隐私内容），sync 会把它们重新写入 md。

**方案**：`data/deleted.txt` 记录永久跳过的 memo id，sync 时 skip。

格式（每行一个，`#` 开头是注释）：

```
# 格式：<tab>/<id>
qh/qh42
jg/jg128
```

**完整删除流程**：

```bash
# 1. 登记永久跳过
echo "qh/qh42" >> data/deleted.txt

# 2. 删除现有 md 文件
rm src/content/memos/qh/qh42.md

# 3. 验证 sync 不会重新生成（它应该跳过并在日志中显示 SKIP）
pnpm sync | grep -i qh42

# 4. 提交
git add -A && git commit -m "remove: qh/qh42 (隐私)" && git push
```

---

## 绑定自定义域名（规划）

未来买了域名（如 `ayada.xxx`）：

1. DNS 服务商加 CNAME 记录：`ayada.xxx → 73nuts.github.io`
2. GitHub 仓库 Settings → Pages → Custom domain 填入 `ayada.xxx`，勾选 Enforce HTTPS
3. 改 `astro.config.mjs`：
   ```js
   site: 'https://ayada.xxx',
   base: '/',               // 从 '/flomo-site' 改成根路径
   ```
4. `git push` → Actions 重建上线

---

## 本地开发提示

- 字体文件较大，首次 `pnpm install` 会下到 `node_modules/` 里约 40 MB
- 热更新能感知 `src/` 变动；`~/Documents/flomo-sync/` 不监听（手动 `pnpm sync` 触发）
- `pnpm build` 产物约 43 MB（大头是字体），CDN gzip 后单页实际下载 ~200 KB
- Svelte 5 使用 runes 语法：`$state`、`$props`、`$derived`

---

## 架构决策记录

- v1（`design-v2-good-taste` 分支）：基于 Claude Design handoff bundle，React 18 + Babel 浏览器运行时编译。视觉还原但运行时 ~150 KB Babel 负担，数据结构是 JS 对象字面量。
- v2（当前 master）：完整重写为 Astro SSG，每条 memo 独立 URL，默认零 JS，可分享可 SEO。

---

## 未完成项

见 [TODO.md](./TODO.md)
