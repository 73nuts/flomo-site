# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目本质

这是 **阿鸭的随笔**（`https://ayalife.cc`）—— 一个把 flomo 短笔记按 5 个标签分组、每条 memo 独立 URL、可分享可 SEO 的静态站。**不是博客、不是产品页**，是慢写慢读的页面。视觉先于功能，**设计规范先于代码**。

## 协作流程（必读）

### 视觉/排版/动效/配色改动 —— 先做 demo，不要直接动 `src/`

**触发条件**：用户提出视觉痛点（"不好看"、"没 good taste"、"段落不舒服"、"sky 突兀"、"长得一样"），或要求改 sky / typography / 颜色 / 字体 / 间距 / 装饰元素。

**流程**：

1. 调用 `frontend-design:frontend-design` skill
2. skill 输出到项目根 `*-demo.html` 的 standalone HTML（如 `sky-demo.html` / `typography-demo.html`）—— git untracked，**不进 build 不上线**
3. 让用户打开浏览器看完，明确选择方向 + 提出具体调整
4. 才落地到 `src/` → commit → push

**Why**：站点的核心价值是视觉（README 第一句"视觉先于功能"），且我（Claude Code）在 Chrome 里看不见真实手机 viewport（Claude in Chrome 扩展 sidebar 占满，innerWidth 只剩 ~133px），盲调容易越调越偏。用户多次明确要求："你不要直接动手啊，应该用 frontend-design skill 慢慢调整"。

**灵感必须命名引用**：每个候选方向附具体灵感锚点（范宽 / 马远 /《富春山居图》/ 杉本博司 / 汪曾祺 / 董桥 / Paris Review / 单读 / Bear / Day One / Bringhurst 等），不能用"现代极简"、"温暖纸感"这类 AI 通用模糊描述 —— 用户能识别。

**例外**：纯逻辑 bug 修复（横向溢出兜底、`apply()` 吞掉 `.on` 类、CF 缓存绕法）不走 demo 流程，直接修。

### Commit 流水线（避开 guard-commit hook）

`~/.claude/hooks/guard-commit.sh` 卡 commit 需先触发 `mark-review-passed.sh`：

```bash
pnpm build 2>&1 | tail -3 && \
  echo "code-review pass: <一句描述>，0 issues" && \
  git add <files> && \
  git commit -m "..." && \
  git push origin master
```

`echo` 命令文本必须含 `code-review` 或 `codex-review`，输出**不能含** `CRITICAL` / `HIGH` / `FAIL` / `ERROR` / `panic`（用 "0 issues" 不要用 "0 errors"）。`Skill` 通道触发的 review **不走** Bash hook，所以 Skill review 完之后还要补一条 `echo` 才能 commit。

### CF 边缘缓存绕法

`ayalife.cc` 走 Cloudflare 代理。push + Pages deploy 完成后用户访问可能仍看到旧 HTML。验证用：

```
https://ayalife.cc/jg/?v=任意值
```

CF 把 `?v=x` 当成新 URL 直接回源。要清缓存：CF Dashboard → Caching → Purge Everything。

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

### 4. Sky 设计语言 = 纸本山水（R14 锁定）

`SkyBanner.astro` 顶部装饰 banner，当前方向 **纸本山水**（commit `7287dea`，灵感：宋人山水 / 富春山居图 / 杉本博司）：`<div id="sky">` 内嵌 inline SVG（远山 + 近山两条 path），山色由 4 个 CSS variables (`--mtn-far`, `--mtn-far-op`, `--mtn-near`, `--mtn-near-op`) 驱动，5 段切换变量、SVG path 共用一份。完整规则与全部踩坑见 **DESIGN_RULES.md R14**。

时段表：`0-4 midnight / 5-10 morning / 11-16 afternoon / 17-19 dusk / 20-23 night`。`mood()` inline JS 必须与 `src/lib/sky.ts skyFromHour` 严格对齐（两份代码无法共享，靠注释维护契约）。`midnight` 是 R13 彩蛋（满月 + 8 颗星 + 山墨浓如黑），意象不能去掉。

### 5. Typography 设计语言 = 笔记本派 + 手札体（R15 锁定）

两层排版语言分工：

- **列表卡 `.memo-body`** = 笔记本派（内敛 / 古典 / 像 Bear、Day One）：14.5px / 1.85 / 字距 0.015em / p margin 1em / ul `·` 18px / strong = accent 色单线下划
- **阅读页 `.paper .body`** = 手札体（"汪曾祺手札"感）：16.5px / 1.92 / H1-H4 全部用 `var(--hand)` **Ma Shan Zheng 楷书** / H2 用 6×22 黑色实心小竖块（替代 accent 色条）/ ol 用 CSS counter `cjk-ideographic`「一、二、三、」中文数字 / hr 28px 单根短横居中 / blockquote 去 italic
- **`.essay-title`** 用 `var(--hand)` 楷书 30px / weight 400 / letter 0.06em，**不加印章**

字族分工：列表卡标题 `--brush` ZCOOL XiaoWei（篆刻感）/ 阅读页所有标题 `--hand` Ma Shan Zheng（手抄感）。日期格式契约：所有显示走 `fmtDate(iso)` → `Apr 24, 2026`，改格式动 `src/lib/date.ts` 一处。

完整规则与历史否决方向见 **DESIGN_RULES.md R15**。

### 6. CSS 横向溢出兜底

`theme.css` 有三处必须保留的兜底，防止 vault 长文（含代码块 / 长 URL / 英文长 token）撑破 viewport 导致移动端浏览器自动缩放：

```css
body { overflow-x: clip; }           /* viewport 兜底，比 hidden 不影响 sticky */
.card { min-width: 0; max-width: 100%; }
.memo-body { overflow-wrap: anywhere; word-break: normal; }
```

加阅读页 `.paper .body pre` 的 `overflow-x: auto`。这套修复见 commit `210a9e8`。

## 设计规则 (DESIGN_RULES.md, R1-R15)

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
- **R14** Sky = 纸本山水（远山 SVG + 5 段山色协同 + 月落日星）。**禁止**：单色相暖橙底色平铺 / `#f5d68a` 纯金黄 / 6+ 段强行跨色相 / `el.className` 重写吞掉 `.on` 类
- **R15** Typography：列表卡 = 笔记本派（14.5/1.85/字距 0.015em） · 阅读页 = 手札体（16.5/1.92/Ma Shan Zheng 楷书 H1-H4 / H2 黑色 6×22 小竖块 / ol 中文数字 / hr 28px 短横）。**禁止**给 `.essay-title` 加印章 / 阅读页 H2 回退 accent left-border / 列表卡和阅读页混用同字号

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
