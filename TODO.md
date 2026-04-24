# 待办清单

按优先级排序。完成后删掉对应条目。

---

## 从 Code Review 留下的 Info 项

### [P2] ReaderNav 使用 `navigate()` 而非 `window.location.href`

**现状**：`src/components/islands/ReaderNav.svelte` 键盘 ← → 与滑动翻页用 `window.location.href = href` 触发**全页刷新**，绕过了 Astro 的 ClientRouter 视图过渡。

**影响**：每次翻页会闪一下白（或 base background），无淡入效果。体感稍硬。

**修复**：改用 `import { navigate } from 'astro:transitions/client'`：

```ts
import { navigate } from 'astro:transitions/client';
// ...
if (e.key === 'ArrowLeft' && prevHref) navigate(prevHref);
```

**决定前先验证**：用户如果觉得当前翻页是"全页重新加载"的仪式感（像翻页），就保留；如果希望无感切换（像滚动），改。不阻塞，视体验反馈定。

---

### [P2] 字体子集化

**现状**：`dist/` 约 43 MB，大头是 4 个字族 × 多字重（Noto Serif SC 400/500/600 + Ma Shan Zheng + ZCOOL XiaoWei）。首次访问约 600 KB 实际下载（Pages 默认 gzip 后）。

**影响**：首屏快，但 refresh 或首次访问手机弱网环境下字体 FOIT 明显。

**修复选项**：
- A. `@fontsource/noto-serif-sc/chinese-simplified-400.css` —— 只加载简体子集（约 -50% 大小）
- B. 用 `glyphhanger` 工具基于实际文本生成按需子集
- C. 把装饰字体（Ma Shan Zheng + ZCOOL XiaoWei）改成 lazy 加载（只在 header / tab 卡出现时需要）

方案 A 最简单，先试。

---

## 功能扩展

### [P1] vault 长文导入

**待引入的两篇**：
- `/Users/curtis/vault/大教堂与赌场.md`
- `/Users/curtis/vault/TACO 交易的自反性悖论.md`

**问题**：这些是**系统化长文**，不适合塞进现有 5 个碎片 tab（flomo 的短随笔格式）。

**候选方案**：

1. **独立 collection `essays`**（最干净）：
   - 新 `src/content/essays/*.md`
   - 新 `src/pages/essays/index.astro` + `src/pages/essays/[slug].astro`
   - 入口页加第 6 个"长文"入口或独立区域
   - 需要简单 frontmatter：title / date / description / tags

2. **第 6 个 tab「观察」**：
   - 现有 `TabId` enum 加一项
   - 影响入口页 5 张便签布局，需要重新调整网格
   - 长文和短文在同一 UI 下不协调

3. **根目录独立页 `/essays/<slug>`**：
   - 不作为 tab，只作为超链接或从首页底部入口访问

**推荐方案 1**。工作量：~1 小时。等用户确认方向后做。

---

### [P1] 自动同步 flomo

**目标**：不要每次手动导出 + 手动 sync + 手动 commit。

**演进路径**：

1. **命令封装（最快）**：
   - 新增 `pnpm site:publish` = sync + git add + commit + push
   - package.json 里一行脚本

2. **本地 cron（中）**：
   - macOS launchd 定时（每晚 23:00）跑同步 + push
   - 前提：flomo 导出也能自动化（目前是手动下载 zip）

3. **flomo API 直拉（最优雅）**：
   - flomo Pro 有 API（token 从浏览器 Cookie 或 [Memos API 接口](https://flomoapp.com/mine?source=open_api)）
   - `sync.ts` 拓展为 fetch API → 转 md
   - GitHub Actions 定时（cron）拉最新 + build + deploy
   - 需要 flomo Pro 会员 + 把 token 存到 GH Secrets

**硬约束**：**删除保护必须先生效**（见 README.md 的 data/deleted.txt 机制）。否则自动同步会把手动删除的隐私条目拉回来。

目前 deleted.txt 已初始化。后续若改成自动同步，先测 deleted.txt 生效再上线。

---

### [P2] ID 稳定性

**现状**：memo id = `${tab}${索引}`（如 `jg0`、`jg1`、`jg2`...），索引 = flomo HTML 里 `.memo` 的数组位置。

**风险**：若 flomo 侧删除了一条 memo 再导出，后续所有 id 会 shift。比如原来的 `jg42` 变成了 `jg41`，导致：
- `data/deleted.txt` 里记的跳过 id 失效
- 已分享的 URL 指向不同内容
- git diff 噪音极大（746 条 md 文件全部重写）

**方案**：改 id 为 `${yyyymmdd}-${hhmmss}`（基于 flomo 原始 time 字段），例如 `20260116-182134`。天然稳定，无序列依赖。

**代价**：
- 需要改 `sync.ts` 输出逻辑 + 文件名
- 已存在的 746 个 md 文件需要全部迁移（git 上会显示大量 rename）
- URL 会变（当前未公开部署，影响面小）

**建议时机**：在做自动同步之前做这个，否则后续问题更大。

---

## 运维

### [P1] 域名解析

用户计划近期购买域名。见 `README.md` → [绑定自定义域名（规划）](./README.md#绑定自定义域名规划) 章节的 4 步指引。

操作顺序：
1. 买域名
2. DNS 配 CNAME → 73nuts.github.io
3. 仓库 Settings → Pages → Custom domain
4. 改 `astro.config.mjs` 的 `site` 和 `base` → push

---

## 视觉 / 体验可改进项（待用户验收后补充）

（首次线上访问后记录你实际观察到的问题到这里）

- [ ] ……
