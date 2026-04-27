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

## R13 · 彩蛋清单（2026-04-24 锁定）

五个触发式彩蛋，都用 `var(--brush)` 字体（和主视觉一致），不用 emoji/卡通，保持原版纸本质感。

| # | 触发条件 | 效果 | 实现位置 |
|---|---|---|---|
| 1 | 00:00-04:59 访问 | Sky banner 变深蓝星空色 + 8 颗 **Cosmic Latte** 星点（#FFF8E7，2003 年 Glazebrook & Baldry 用 2dF 巡天 20 万星系算出的宇宙平均色，叙事彩蛋藏在视觉里，不外露 tooltip）；计数卡底部多一行「这 么 晚 还 想 我，快 去 睡 吧」+ 轻摇小月亮 🌙 | `SkyBanner.astro` · `lib/sky.ts`（midnight 类型）· `VisitCounter.svelte`（isMidnight 分支）|
| 2 | 当日访问次数 ≥ 10 | 计数卡底部浮现「既 然 这 么 想 我，不 如 给 我 发 消 息 吧」，左侧一枚线描信封 SVG | `VisitCounter.svelte`（n >= 10 分支）|
| 3 | 阅读页点击底部「终」字 | 终字弹跳 + 5 颗小心随机飞散上浮 + 顶部浮现「你 看 完 啦 ~」1.8s | `EndMark.svelte` island（`[slug].astro` 引用）|
| 4 | 首页头像 2 秒内连点 10 次 | DOM 粒子烟花：45 颗主波 + 200ms 后 12 颗余波，♥✦✧❀❁✿❤ × 6 色，translate3d GPU 合成 | `index.astro` inline script + `#fireworks-layer` |
| 5 | 任意页面打开 DevTools | console 输出 ASCII 阿鸭 + 「偷偷翻代码的你，被阿鸭看到啦 ~」 | `Base.astro`（`<script is:inline>`，session 级去重）|

**禁止**：
- 彩蛋使用非现有 4 字族字体或 emoji（破坏整体纸质感 —— emoji 曾出现过"像彩纸屑廉价"问题）
- 彩蛋粒子用 `filter: drop-shadow` / `text-shadow`（强制合成层爆炸，卡帧元凶）
- canvas-based 粒子（`shapeFromText` 光栅化字符后像素糊，不如 DOM 原生字体清晰）
- 阅读页静态 `<div class="end-mark">终</div>`（已被 EndMark 交互岛取代，不要回退）

**加新彩蛋时**：
- 触发条件必须罕见（连点 N 次 / 特定时间 / 里程碑 / 快捷键），不能频繁触发打扰阅读
- 优先用 CSS 动画 + DOM，别上 canvas/WebGL
- 粒子数 ≤ 60（DOM 版阈值），用 `transform` + `opacity` 让合成层接管

---

## R14 · Sky 设计 = 纸本山水（2026-04-26 锁定）

**规则**：`SkyBanner.astro` 是顶部的"远山"装饰，**5 段时段共用同一道 SVG 远山轮廓 + 由 CSS variables 切山色**。灵感：宋人山水（范宽 / 马远）/《富春山居图》/ 杉本博司《海景》。

**结构**：
- `<div id="sky">` 内嵌 inline SVG（远山 + 近山两条 path）
- 山色由 4 个 CSS variables 驱动：`--mtn-far` / `--mtn-far-op` / `--mtn-near` / `--mtn-near-op`
- 5 段 mood class 各自切换这 4 个变量 + 调整背景 gradient（含落日 / 月 / 星等具象元素）

**5 段视觉策略**：
| 时段 | 特征 |
|---|---|
| morning | 雾里隐青：淡蓝灰天 + 远山若隐若现 |
| afternoon | 青翠分明：淡米青天 + 山轮廓清晰 |
| dusk | 逆光剪影：暖橙天 + 落日 + 山墨黑 |
| night | 月在山上：深蓝天 + 左侧月亮 + 散星 + 山墨蓝 |
| midnight | 墨浓如黑（R13 彩蛋）：极深紫蓝 + 满月 + 8 颗 Cosmic Latte 星（#FFF8E7，宇宙平均色）+ 山近黑 |

**禁止**（之前迭代踩过的坑）：
- ❌ 5 段都用单色相暖橙/暖金底色 → "看起来一样"
- ❌ 整段 linear-gradient 调成 `#f5d68a` 等纯金黄 → 塑料感
- ❌ 6 段以上 linear-gradient 强行跨色相（如 `#c79aaa → #a898b5` 冷紫急转）→ 出 banding 横带
- ❌ radial 衰减 `transparent 60%` 与 linear stop 撞同一带 → 撞色 banding
- ❌ `apply()` 用 `el.className = 'sky ' + mood` 重写整段 className → 吞掉 fadeIn 的 `.on` 类，每分钟闪一下。**必须用 `classList.remove(...)/add(...)` 单独操作时段类**
- ❌ 把 SkyBanner 改回 svelte 岛屿（R6 锁定，历史 mobile bug）
- ❌ 把 midnight 8 颗星点 fill 改回纯白 `rgba(255, 255, 255, …)`（R13 锁定为 Cosmic Latte `rgba(255, 248, 231, …)`，宇宙平均色叙事不能丢）
- ❌ 给 midnight 星点加 hover tooltip 暴露考据（"知道的人会心一笑"原则：彩蛋藏在视觉里就够了，外露说明会显得很不自然）

**契约维护**：`mood()` inline JS 与 `src/lib/sky.ts skyFromHour` 是两份代码（inline script 不能 import TS），靠注释 `与 src/lib/sky.ts skyFromHour 严格对齐` 维护契约。

时段表：`0-4 midnight / 5-10 morning / 11-16 afternoon / 17-19 dusk / 20-23 night`。

---

## R15 · Typography = 笔记本派 + 手札体（2026-04-26 锁定）

**两层排版语言分工**：

**列表卡 `.memo-body` —— 笔记本派**（内敛 / 古典 / 像 Bear、Day One）：
- font-size 14.5px / line-height 1.85 / letter-spacing 0.015em
- p margin 1em
- ul `·` 18px 4px-left（不用 `•`）
- strong = accent 色单线下划

**阅读页 `.paper .body` —— 手札体**（"汪曾祺手札"感 / 楷字标题）：
- font-size 16.5px / line-height 1.92 / letter-spacing 0.025em
- H1 / H2 / H3 / H4 全部用 `var(--hand)` **Ma Shan Zheng 楷书**（不是 ZCOOL）
- H2 用 `::before` 6×22 黑色实心小竖块替代 accent 色条
- ul 黑色 4px 圆点（不用 accent）
- ol 用 CSS counter `cjk-ideographic`「一、二、三、」中文数字
- hr 28px 单根短横居中
- blockquote 去 italic（中文 italic 丑），1px ink-soft 单线
- `.essay-title` 用 `var(--hand)` 楷书 30px / weight 400 / letter 0.06em

**字族分工**：列表卡标题用 `--brush` ZCOOL XiaoWei（篆刻感）；阅读页所有标题用 `--hand` Ma Shan Zheng（手抄感）。卡是预览，札是手抄 —— 两层视觉语言不同字族。

**禁止**：
- 列表卡和阅读页混用同一套字号 / 行高（必须分层：卡 = 摘要密度 / 读 = 沉浸密度）
- 给 `.essay-title` 加印章、装饰元素（用户已明确否决）
- 阅读页 H2 回退到 accent 色 left-border（已被黑色竖块取代）

**日期格式契约**：列表 + 阅读页 + meta 全部走 `fmtDate(iso)` → `Apr 24, 2026`。改格式动 `src/lib/date.ts` 一处。

---

改动这里的规则前，先和用户确认。规则先于代码。
