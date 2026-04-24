#!/usr/bin/env bun
/**
 * flomo 原始导出 HTML → Astro Content Collection markdown。
 *
 *   SYNC_DIR/<tab>/阿鸭的笔记.html     （flomo 手动导出）
 *        ↓
 *   src/content/memos/<tabId>/<tabId><N>.md  （Astro 内容源）
 *
 * 每次运行会清空 <tabId> 目录后重新生成，保持严格一致。
 *
 * 用法：
 *   pnpm sync                            # 默认读 ~/Documents/flomo-sync
 *   FLOMO_SYNC_DIR=/path pnpm sync       # 指定其他路径
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { TABS } from '../src/lib/tabs.ts';

const SYNC_DIR = process.env.FLOMO_SYNC_DIR ?? join(homedir(), 'Documents', 'flomo-sync');
const OUT_DIR = join(process.cwd(), 'src', 'content', 'memos');

type Body = string | { kind: 'list'; items: string[] };

interface RawMemo {
  time: string;
  contentEl: HTMLElement;
}

/** 去掉 #tag 段并提取 tag 列表 */
function extractTags(contentEl: HTMLElement): string[] {
  const tags: string[] = [];
  for (const p of contentEl.querySelectorAll('p')) {
    const txt = p.text.trim();
    // 整段都是 #tag #tag2 的（flomo 自动插入的标签段）
    if (txt && txt.split(/\s+/).every((w) => w.startsWith('#'))) {
      for (const w of txt.split(/\s+/)) tags.push(w.slice(1));
      p.remove();
    }
  }
  // 行内 #tag（保留文字，只提取 tag）
  const inline = contentEl.text.match(/#([^\s#<]+)/g);
  if (inline) {
    for (const t of inline) {
      const name = t.slice(1);
      if (!tags.includes(name)) tags.push(name);
    }
  }
  return tags;
}

/** .content 节点 → 纯文本 markdown body */
function nodeToBody(contentEl: HTMLElement): Body {
  // 纯列表
  const children = contentEl.childNodes.filter((n) => 'tagName' in n) as HTMLElement[];
  if (children.length === 1 && children[0]?.tagName === 'UL') {
    const items = children[0].querySelectorAll('li').map((li) => li.text.trim()).filter(Boolean);
    if (items.length) return { kind: 'list', items };
  }

  // 段落
  const paras: string[] = [];
  for (const p of contentEl.querySelectorAll('p')) {
    const t = p.text.trim();
    if (t) paras.push(t);
  }
  if (!paras.length) return contentEl.text.trim();
  if (paras.length === 1) return paras[0]!;
  return paras.join('\n\n');
}

/** flomo time 字段如 "2026-01-16 08:12:34" → { date, time } */
function splitTime(raw: string): { date: string; time?: string } {
  const m = raw.trim().match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/);
  if (!m) return { date: raw };
  return { date: m[1]!, time: m[2] };
}

function extractMemos(html: string): RawMemo[] {
  const root = parse(html);
  const memos: RawMemo[] = [];
  for (const el of root.querySelectorAll('.memo')) {
    const timeEl = el.querySelector('.time');
    const contentEl = el.querySelector('.content');
    if (!timeEl || !contentEl) continue;
    memos.push({ time: timeEl.text.trim(), contentEl });
  }
  return memos;
}

function toMarkdown(meta: {
  id: string;
  tab: string;
  date: string;
  time?: string;
  tags: string[];
  from?: string;
  body: Body;
}): string {
  const fmLines = [
    `id: "${meta.id}"`,
    `tab: "${meta.tab}"`,
    `date: "${meta.date}"`,
  ];
  if (meta.time) fmLines.push(`time: "${meta.time}"`);
  if (meta.tags.length) fmLines.push(`tags: [${meta.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  if (meta.from) fmLines.push(`from: ${JSON.stringify(meta.from)}`);

  const fm = ['---', ...fmLines, '---', ''].join('\n');

  const body =
    typeof meta.body === 'string'
      ? meta.body
      : meta.body.items.map((it) => `- ${it}`).join('\n');

  return `${fm}${body}\n`;
}

async function syncTab(tab: (typeof TABS)[number]) {
  const src = join(SYNC_DIR, tab.dir, '阿鸭的笔记.html');
  const outDir = join(OUT_DIR, tab.id);

  if (!existsSync(src)) {
    console.warn(`[sync] ${tab.id} ← 源文件不存在：${src} —— 跳过`);
    return { tab: tab.id, count: 0 };
  }

  const html = readFileSync(src, 'utf8');
  const raw = extractMemos(html);

  // 清空 + 重建目录（严格一致性）
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  let written = 0;
  for (let i = 0; i < raw.length; i++) {
    const { time, contentEl } = raw[i]!;
    const { date, time: hm } = splitTime(time);
    const tags = extractTags(contentEl);
    const body = nodeToBody(contentEl);
    if (typeof body === 'string' && !body) continue;
    if (typeof body !== 'string' && !body.items.length) continue;

    const id = `${tab.id}${i}`;
    const md = toMarkdown({ id, tab: tab.id, date, time: hm, tags, body });
    await writeFile(join(outDir, `${id}.md`), md, 'utf8');
    written++;
  }

  console.log(`[sync] ${tab.id} ← ${tab.dir}: ${written} 条`);
  return { tab: tab.id, count: written };
}

async function main() {
  console.log(`[sync] FLOMO_SYNC_DIR = ${SYNC_DIR}`);
  if (!existsSync(SYNC_DIR)) {
    console.error(`[sync] 同步目录不存在。设置 FLOMO_SYNC_DIR 或把 flomo 导出放到 ${SYNC_DIR}`);
    process.exit(1);
  }
  const results = await Promise.all(TABS.map(syncTab));
  const total = results.reduce((a, b) => a + b.count, 0);
  console.log(`[sync] 完成：共 ${total} 条`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
