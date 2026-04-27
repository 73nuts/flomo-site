#!/usr/bin/env bun
/**
 * 写一条手写笔记 —— 不走 flomo，直接落到 src/content/memos/<tab>/<id>.md
 *
 *   pnpm new
 *
 * 流程：
 *   1. 选 tab (jg/ds/qh/gd/wa)
 *   2. [可选] 标题（长文用） / from（ds 引用） / tags
 *   3. 自动生成 id = yyyymmdd-hhmmss（与 sync.ts 对齐）
 *   4. 创建 .md 含 frontmatter，调 $EDITOR 打开
 *   5. 用户写完保存退出 → 文件就位，pnpm dev 立即可见
 *
 * source 字段固定 "manual"，sync 永远不动。空 body 自动清理。
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { TABS, type TabId } from '../src/lib/tabs.ts';

const EDITOR = process.env.EDITOR || process.env.VISUAL || 'vi';
const ROOT = process.cwd();

const pad = (n: number) => n.toString().padStart(2, '0');

function genId(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const yamlEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  // piped stdin 结束后 readline 会进入 closed 状态，再问就抛 ERR_USE_AFTER_CLOSE。
  // 把每次问题包成 ask()，EOF 当作"用户跳过"返回空串，让 CLI 也能在脚本场景下跑。
  const ask = async (prompt: string): Promise<string> => {
    try {
      return (await rl.question(prompt)).trim();
    } catch {
      return '';
    }
  };

  console.log('\n  阿鸭的随笔 · 写一条新笔记\n');
  TABS.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.id.padEnd(3)} ${t.name}   ${t.subtitle}`);
  });

  const tabAns = (
    await ask('\n  选哪个？(数字 1-5 或字母 jg/ds/qh/gd/wa): ')
  ).toLowerCase();
  let tab: TabId | undefined;
  const num = parseInt(tabAns, 10);
  if (num >= 1 && num <= TABS.length) {
    tab = TABS[num - 1]!.id;
  } else if (TABS.some((t) => t.id === tabAns)) {
    tab = tabAns as TabId;
  }
  if (!tab) {
    console.error('  ✗ 无效选择，退出');
    rl.close();
    process.exit(1);
  }

  const title = await ask('  标题（长文用，回车跳过）: ');
  const from =
    tab === 'ds'
      ? await ask('  from 引用归属（如 汪曾祺《人间草木》，回车跳过）: ')
      : '';
  const tagsRaw = await ask('  tags（逗号分隔，回车跳过）: ');

  rl.close();

  const now = new Date();
  const id = genId(now);
  const outDir = join(ROOT, 'src', 'content', 'memos', tab);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${id}.md`);

  if (existsSync(outPath)) {
    console.error(`  ✗ 文件已存在: ${outPath}`);
    process.exit(1);
  }

  const fm: string[] = [
    '---',
    `id: "${id}"`,
    `tab: "${tab}"`,
    `date: "${fmtDate(now)}"`,
    `time: "${fmtTime(now)}"`,
  ];
  if (title) fm.push(`title: "${yamlEscape(title)}"`);
  if (from) fm.push(`from: "${yamlEscape(from)}"`);
  if (tagsRaw) {
    const arr = tagsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length)
      fm.push(`tags: [${arr.map((t) => `"${yamlEscape(t)}"`).join(', ')}]`);
  }
  fm.push('source: "manual"');
  fm.push('---');
  fm.push('');
  fm.push('');

  writeFileSync(outPath, fm.join('\n'), 'utf8');

  console.log(`\n  → 打开 ${EDITOR} ${relative(ROOT, outPath)}\n`);
  const r = spawnSync(EDITOR, [outPath], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`  ✗ 编辑器退出码 ${r.status}`);
    process.exit(r.status ?? 1);
  }

  // body 为空 → 自动清理（用户改主意了）
  const final = readFileSync(outPath, 'utf8');
  const body = final.replace(/^---[\s\S]*?\n---\s*/m, '').trim();
  if (!body) {
    unlinkSync(outPath);
    console.log('\n  · body 为空，已删除草稿，退出');
    return;
  }

  const rel = relative(ROOT, outPath);
  console.log(`\n  ✓ 已写入 ${rel}\n`);
  console.log('  下一步：');
  console.log(`    pnpm dev                              本地预览`);
  console.log(`    git add ${rel}`);
  console.log(`    git commit -m "data(${tab}): ${title || id}"`);
  console.log(`    git push                              发布到 ayalife.cc\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
