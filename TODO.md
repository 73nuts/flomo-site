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

### [部分完成] vault 长文导入

**临时方案已上线**：两篇 vault 长文以 `source: vault` + `title` 字段塞进 jg 列表卡：
- `src/content/memos/jg/essay-cathedral-and-casino.md` ✓
- `src/content/memos/jg/essay-taco-reflexivity.md` ✓
- 列表卡通过 `LongMemo.svelte` 折叠展示摘要，点开走完整阅读页（`.paper`，已套用 R15 手札体排版）

**长期决策仍 pending**：是否抽出独立 collection？

候选方向（如要做再讨论）：
1. **独立 collection `essays`**（最干净）：新 `src/content/essays/*.md` + `src/pages/essays/...`，入口页加第 6 个"长文"入口
2. **第 6 个 tab**：影响入口页 5 张便签布局
3. **根目录 `/essays/<slug>`**：不作为 tab，超链接访问

短期看放在 jg 没问题（已用 R15 手札体阅读页排版）；长文累积到 5 篇以上再考虑分离。

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

### [DONE] ID 稳定性

memo id 已落到 `yyyymmdd-hhmmss` 格式（如 `20260116-182134`），来自 flomo 原始时间戳。`scripts/sync.ts` 第 9-13 行有契约注释。flomo 删一条不再让其他 id shift，`deleted.txt` 与已分享 URL 都稳定。**自动同步的前置条件已就绪。**

---

## 运维

### [DONE 2026-04-24] 域名解析

已上线 `https://ayalife.cc`：
- Dynadot 注册域名 → NS 改到 Cloudflare（mike/sue.ns.cloudflare.com）
- CF DNS 配 4 条 A @ → GitHub Pages IPs + 1 条 CNAME www → 73nuts.github.io（Proxied）
- CF SSL 模式 **Flexible**（Full 会 404，因 GitHub Pages 尚未给该域签 Let's Encrypt 证书）
- GitHub Pages Custom domain = ayalife.cc；`https_enforced: false`（由 CF 负责 HTTPS）
- `astro.config.mjs` site=`https://ayalife.cc`, base=`/`
- `public/CNAME` = `ayalife.cc`

**仍未做**：
- CF SSL/TLS → Edge Certificates 打开 "Always Use HTTPS" + "Automatic HTTPS Rewrites"
- 长期上可切回 Full：先临时把 DNS 改成 DNS only（灰云）让 GH 签证书，再切回 Proxied

---

## 视觉 / 体验可改进项（待用户验收后补充）

（首次线上访问后记录你实际观察到的问题到这里）

- [ ] ……

---

## 最近完成（DONE）

### [DONE 2026-04-26] Typography 落定 = 笔记本派 + 手札体

`09b7e6c` + `7f005a2`。列表卡走"笔记本派"（14.5/1.85），阅读页走"手札体"（H1-H4 用 Ma Shan Zheng 楷书 / H2 黑色 6×22 小竖块 / ol 中文数字 / hr 28px 短横）。完整规则锁死在 DESIGN_RULES.md **R15**。

### [DONE 2026-04-26] Sky = 纸本山水

`7287dea` + 多次迭代 (`56eb810` `92abcc1`)。`<div id="sky">` 内嵌 inline SVG（远 + 近双层山轮廓 path），山色由 4 个 CSS variables 切换。完整规则锁死在 DESIGN_RULES.md **R14**。

历经 5 次方向迭代（暖纸光斑 / 低饱和米白 / 三联日间 / 单色相 + 光斑 / 纸本山水），最终定稿。踩坑结论已固化。

### [DONE 2026-04-25] 列表页横向溢出修复

`210a9e8`。vault 长文含 JS 代码 / 长 URL 撑破 viewport，移动端浏览器自动按内容缩放。修法：`body { overflow-x: clip }` + `.card { min-width: 0; max-width: 100% }` + `.memo-body { overflow-wrap: anywhere }` 三件套兜底。

### [DONE 2026-04-25] 项目级 CLAUDE.md

`aa77c90`。给未来 Claude Code 会话固化的项目知识：架构 6 块大图 / DESIGN_RULES R1-R15 摘要 / CF 缓存绕法 / commit 风格。
