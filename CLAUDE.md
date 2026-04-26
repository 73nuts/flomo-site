# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目本质

这是 **阿鸭的随笔**（`https://ayalife.cc`）—— 一个把 flomo 短笔记按 5 个标签分组、每条 memo 独立 URL、可分享可 SEO 的静态站。**不是博客、不是产品页**，是慢写慢读的页面。视觉先于功能，**设计规范先于代码**。

## 常用命令

```bash
pnpm dev              # 本地开发 (默认 4321)
pnpm build            # 生产构建到 dist/ (~43MB, 大头是字体)
pnpm preview          # 预览生产构建
pnpm sync             # bun 跑 scripts/sync.ts，从 FLOMO_SYNC_DIR 拉 flomo HTML 生成 .md
pnpm check            # astro check (TypeScript + Astro 诊断)
```

部署：push master → `.github/workflows/deploy.yml` 自动 build + 推到 GitHub Pages，CDN 由 Cloudflare 代理。`https://ayalife.cc` (Custom domain) 通常 2-3 分钟生效。

## 架构 —— 必须先理解的"大图"

### 1. 岛屿架构 (R6 锁定)

整站默认 **0 JS**。只有 4 个组件用 `client:*` 指令做客户端水合：
- `LongMemo.svelte` (`client:idle`) — 长文折叠
- `ReaderNav.svelte` (`client:load`) — 阅读页键盘/滑动翻页
- `VisitCounter.svelte` (`client:only="svelte"`) — localStorage 访问计数
- `EndMark.svelte` (`client:load`) — 阅读页底部"终"字交互

**`SkyBanner.astro` 故意不是 svelte 岛屿** —— 历史 bug：`<astro-island>` 包装在 mobile Chrome 把 sky 宽度限制成左半屏。改成 `<div>` + `<script is:inline>`，div 在服务端渲染，客户端 inline 脚本只切 class。**不要回退**。

### 2. 数据层 —— 三种 source 协同

每条 memo `.md` frontmatter 必带 `source` 字段，决定 sync 行为：

| source   | 来源                              | sync 行为      |
|----------|-----------------------------------|----------------|
| `flomo`  | `pnpm sync` 从 flomo HTML 生成    | **每次重写覆盖** |
| `vault`  | `~/vault/` 手工搬运的长文（带 title） | sync 不动      |
| `manual` | 完全手写条目                      | sync 不动      |

**删除保护**：`data/deleted.txt` 每行 `<tab>/<id>`，sync 时永久跳过。这条机制是**自动同步上线的前置条件** —— 没有它，删过的隐私条目会被 flomo 重新导出拉回来。

**已知风险（见 TODO.md）**：当前 `id = ${tab}${index}`，flomo 删一条后续 id 全 shift。`yyyymmdd-hhmmss` 是稳定方案，必须在做自动同步之前迁移。

### 3. 5 个 tab —— 单一真源

`src/lib/tabs.ts` 是 jg/ds/qh/gd/wa 的唯一配置（id / 名称 / accent / 源目录）。改名换色：动这一处即可。**新增 tab 还要在 `src/content/config.ts` Zod enum 加 id**。

`R11` 锁定显示名和 accent 配色 —— 不能改 id（`deleted.txt` 和已分享 URL 全失效），也不能把 gd 显示名改回"灌点鸭汤"（源目录名 vs 展示名是两回事）。

### 4. Sky 设计语言（已迭代多版，规则锁定）

`SkyBanner.astro` 是顶部装饰 banner —— **5 段时段 + 月山星**。

**当前方向：纸本山水**（commit `7287dea`，灵感：宋人山水 / 富春山居图 / 杉本博司）。结构是 `<div id="sky">` + 内嵌 inline SVG（远山 + 近山两条 path），山色用 4 个 CSS variables (`--mtn-far`, `--mtn-far-op`, `--mtn-near`, `--mtn-near-op`) 驱动，5 段切换变量、SVG path 共用一份。

**踩坑结论（不要重蹈）**：

- ❌ 5 段都用单色相暖橙/暖金 → 会"看起来一样"
- ❌ afternoon 调成 `#f5d68a` 纯金黄 → 塑料感、土气
- ❌ 6+ 段 linear-gradient 强行跨色相（如冷紫 #c79aaa → #a898b5）→ 出 banding 横带
- ❌ radial 衰减 `transparent 60%` 与 linear stop 撞同一带 → 撞色 banding
- ❌ `apply()` 用 `el.className = 'sky ' + mood` 重写整段 → 吞掉 fadeIn 的 `.on` 类，每分钟闪一下
- ✅ 用 `classList.remove(...)/add(...)` 单独操作时段类
- ✅ `mood()` inline JS 必须与 `src/lib/sky.ts skyFromHour` **严格对齐**（两份代码无法共享，靠注释维护契约）

时段表（最新）：`0-4 midnight / 5-10 morning / 11-16 afternoon / 17-19 dusk / 20-23 night`。`midnight` 是 R13 锁定的彩蛋（满月 + 8 颗星），意象不能去掉。

### 5. CSS 横向溢出兜底

`theme.css` 有三处必须保留的兜底，防止 vault 长文（含代码块 / 长 URL / 英文长 token）撑破 viewport 导致移动端浏览器自动缩放：

```css
body { overflow-x: clip; }           /* viewport 兜底，比 hidden 不影响 sticky */
.card { min-width: 0; max-width: 100%; }
.memo-body { overflow-wrap: anywhere; word-break: normal; }
```

加阅读页 `.paper .body pre` 的 `overflow-x: auto`。这套修复见 commit `210a9e8`。

## 设计规则 (DESIGN_RULES.md, R1-R13)

**改这些规则前先和用户确认。规则先于代码。** 摘要：

- **R1** 右上角元素：仅 `ds`(读书笔记) 显示 `from`（作者《书名》），其他 4 个 tab 不渲染
- **R2** ds `from` 出现两次（顶部 meta 区 + 正文末尾斜体右对齐）
- **R3** 卡片倾斜 ±1.2°（10 档 nth-of-type CSS，不能用 JS 随机，超过 ±2° 失败）
- **R4** 顶部双层固定：sky `position:fixed`、topbar `sticky` blur、month-sep `sticky top:54px`
- **R5** 列表底部"今天的第 N 次来看阿鸭" + localStorage/sessionStorage 去重
- **R6** 默认 0 JS，只 4 个岛屿；**SkyBanner 不能改回 svelte 岛屿**
- **R7** 桌面端 ≥1024px 三栏（左 240px 便签架 + 主内容 margin-left:240px）
- **R8** 页面过渡 slide（前进左出右入）
- **R9** `source` 字段 + `data/deleted.txt` 删除保护
- **R10** 自托管 4 字族；**禁止 Google Fonts CDN**（国内访问卡）；禁止加新字族
- **R11** 5 个 tab 顺序与 accent 配色锁定；**禁止改 id 或把 gd 改回"灌点鸭汤"**
- **R12** 移动端优先，`@media (min-width:1024px)` 渐进增强
- **R13** 5 个彩蛋清单：midnight 星空 / VisitCounter ≥10 次 / EndMark 终字 / 头像连点 10 次烟花 / DevTools console ASCII。**禁止 emoji、禁止 `filter: drop-shadow`、禁止 canvas 粒子**（之前踩过）

## 部署 + 缓存

- **CF 边缘可能缓存旧 HTML** 即使 GitHub Pages 已更新。绕缓存：URL 加 `?v=任意值`（query 参数让 CF 当成新资源）。CF Dashboard → Caching → Purge Everything 强制刷新。
- CF SSL 模式 **Flexible**（Full 会 404，因 GitHub Pages 没给该域签 Let's Encrypt）。
- `astro.config.mjs`：`site: 'https://ayalife.cc'`, `base: '/'`。改 `base` 会让所有 asset URL 失效。
- `public/CNAME` = `ayalife.cc`，不要删。

## 项目 commit 风格

中文 commit message，type 前缀英文：`feat / fix / refactor / docs`。常见模式：

- `feat(sky): ...`
- `fix(sky): bug 描述 — 根因 + 修法`
- `data: MM-DD`（pnpm sync 后批量更新）
- `refactor: ...`

不带 emoji。`Co-Authored-By` 行用户视情况添加。
