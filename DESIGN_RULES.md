# 阿鸭的随笔 · 设计规范

> 锁定的规则。动这些规则之前先问用户。

---

## R1 · 右上角元素：仅读书笔记显示归属

**规则**：memo 卡片 / 阅读页顶部 meta 区的右上角：
- **读书笔记（ds）**：显示 `<作者> <《书名》>`（字段 `from`）
- **吉光片羽 / 阿鸭情话 / 浮一大白 / 晚安计划（jg/qh/gd/wa）**：**不渲染任何内容**
- 左上角：日期（所有 tab 统一）

**实现**：
- `sync.ts` 仅对 tab=ds 运行 `extractFromAttribution`，其他 tab 不写 from / tags
- `MemoCard.astro` 右上角只渲染 `data.from`（有则显示）
- `pages/[tab]/[slug].astro` 同上

**禁止**：
- 任何 tab 的 meta 区显示 `tags` 数组（flomo 自动插入的 `#吉光片羽` 等标签段在 sync 时被清理）
- ds 以外的 tab 自动生成 from

---

## R2 · 读书笔记 from 双位置

**规则**：ds 阅读页的 `from` 出现在**两个位置**：
1. 顶部 meta 区右上角（短展示，单行，超长省略号）
2. 正文末尾 `— <from>`（斜体，右对齐）

**理由**：原版 handoff 的视觉：顶部标注 + 文末归属，呼应"书摘"传统排版。

---

## R3 · 卡片微倾斜 ±1.2°

**规则**：列表卡（`.card`）使用 10 档 nth-of-type CSS 实现 ±1.2° 范围内随机倾斜。
- hover / focus → 扶正 `rotate(0)` + 上浮 3px
- active（按下）→ scale 0.992 + 折角 `opacity: 1`

**理由**：原版设计稿验证——卡片只需"纸张自然落下"的错位感，超过 ±2° 就从"质感"滑向"卡通"。

**禁止**：
- 用 JS 每次刷新生成不同角度（破坏"纸张恒定位置"直觉）
- 倾斜超过 ±2°（视觉冲突 + 阅读不适）

---

## R4 · 顶部双层固定

**规则**：列表页顶部：
1. **Sky banner** `#sky`：`position: fixed; top: 0; height: 360px`，随系统时间 morning/afternoon/dusk/night 切换
2. **Topbar**（返回 / 标题 / 计数）：`position: sticky; top: 0; z-index: 20`，背景 transparent + backdrop-filter blur，让 sky 色透过
3. **Month 分隔符**：`position: sticky; top: 54px`，滚动时贴住 topbar 下沿

**三层视觉层级（从顶到底）**：sky → topbar → month-sep → 卡片流。

**禁止**：
- sky 改 absolute（会随滚动消失）
- topbar 背景纯色（遮挡 sky 色彩）

---

## R5 · 列表底部小签名

**规则**：每个 tab 列表页底部显示「今 天 的 第 N 次 来 看 阿 鸭」。
- 数字 N 用手写字体 `var(--hand)`，微旋转 -4°
- 虚线上分隔
- localStorage + sessionStorage 去重（同一天同一 session 只 +1）

---

## R6 · 默认 0 JS，岛屿按需水合

**规则**：静态内容（卡片、tab 链接、月份分隔、入口页）一律**零 JS**。只有以下 4 个岛屿使用 `client:xxx` 指令：
- `LongMemo.svelte`：长文折叠（`client:idle`）
- `ReaderNav.svelte`：键盘/滑动翻页（`client:load`）
- `VisitCounter.svelte`：localStorage 读写（`client:only="svelte"`）
- `SkyBanner.astro`：is:inline 脚本（**不是 svelte 岛屿**，避免 astro-island 包装 bug）

**禁止**：
- 在本质是静态的组件上加 `client:load`
- 把 SkyBanner 改回 svelte 岛屿（历史 bug：mobile 下 `<astro-island>` 包装导致 sky 只覆盖左半屏）

---

## R7 · 桌面端三栏（≥1024px）

**规则**：`min-width: 1024px` 时：
- 左侧 240px 固定 **便签架**（`<DesktopSidebar>`）：5 张微倾斜便签 + 当前 tab 高亮 + 底部 visit counter
- 右侧主内容 `margin-left: 240px`（`.screen.has-sidebar`）
- topbar 的顶部 padding 从 mobile 的 60px 缩为 32px
- month-sep `top` 从 54px 改为 32px

**移动端 (<1024px)**：sidebar 完全 `display: none`，主内容全宽。

---

## R8 · 页面过渡 slide

**规则**：`<main>` 加 `transition:name="screen"` + `transition:animate="slide"`。
- 所有三级页面（入口 / 列表 / 阅读）主元素共享 transition-name，触发 slide 动画
- 方向：前进时左出右入；后退时相反

---

## R9 · 数据来源（`source` 字段）

**规则**：每条 memo 的 frontmatter 必须有 `source` 字段：
- `flomo`：由 `pnpm sync` 生成，每次 sync 会**重写覆盖**
- `vault`：从 `~/vault/` 手工搬运的长文（带 `title`），sync 不动
- `manual`：其他手写条目，sync 不动

**删除保护**：`data/deleted.txt` 每行 `<tab>/<id>`，sync 时永久跳过。

**ID 规则**：
- `flomo`：`yyyymmdd-hhmmss`（从 flomo 原始时间戳）
- `vault` / `manual`：任意稳定 slug（如 `essay-xxx`），不冲突即可

---

## R10 · 字体

**规则**：自托管 4 个字族（`@fontsource/`）：
- 正文：Noto Serif SC（400/500/600）
- 装饰 / 品牌 / 日期刻印：ZCOOL XiaoWei（`--brush`）
- 数字签名 / "第 N 次"：Ma Shan Zheng（`--hand`）
- UI 小字 / 日期戳：system-ui 无衬线（`--sans`）

**禁止**：
- 加载 Google Fonts CDN（国内访问卡）
- 增加新字族（除非用户明确要求）

---

## R11 · 5 个 tab 顺序与配色

**固定顺序**（`src/lib/tabs.ts`）：

| id | 名称 | subtitle | accent |
|---|---|---|---|
| jg | 吉光片羽 | random thoughts | `#c9a063` 蜂蜜金 |
| ds | 读书笔记 | from the margins | `#8a9aa8` 石青 |
| qh | 阿鸭情话 | for you | `#c77f8a` 腮红 |
| gd | **浮一大白** | cheers to that | `#b88660` 暖炖棕 |
| wa | 晚安计划 | before sleep | `#7a8aa0` 月光蓝 |

**禁止**：
- 把 gd 的显示名改回"灌点鸭汤"（虽然源目录名是 `gd/`，对应 flomo 的"灌点鸭汤"内容，但展示站名字用"浮一大白"）
- 改 id（会让所有 URL 和 deleted.txt 失效）

---

## R12 · 移动端优先

**规则**：所有视觉默认为 mobile。桌面通过 `@media (min-width: 1024px)` 渐进增强。

**禁止**：
- 在 mobile 场景塞三栏 UI
- 假设屏幕宽 > 375px 才能正常工作

---

改动这里的规则前，先和用户确认。规则先于代码。
