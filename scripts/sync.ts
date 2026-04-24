#!/usr/bin/env bun
/**
 * flomo 原始导出 HTML → Astro Content Collection markdown。
 *
 *   SYNC_DIR/<tab>/阿鸭的笔记.html       （flomo 手动导出）
 *        ↓
 *   src/content/memos/<tabId>/<id>.md   （Astro 内容源）
 *
 * id 来自 flomo 原始时间戳：yyyymmdd-hhmmss（如 20260116-182134）。
 * 稳定、URL 友好、跨次导出不 shift。
 *
 * 删除保护：data/deleted.txt 里登记的 <tab>/<id> 不会生成 md。
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
const DELETED_FILE = join(process.cwd(), 'data', 'deleted.txt');

type Body = string | { kind: 'list'; items: string[] };

interface RawMemo {
  time: string;
  contentEl: HTMLElement;
}

function loadDeleted(): Set<string> {
  if (!existsSync(DELETED_FILE)) return new Set();
  const lines = readFileSync(DELETED_FILE, 'utf8').split('\n');
  const out = new Set<string>();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    out.add(line);
  }
  return out;
}

/** 去掉 #tag 段并提取 tag 列表 */
function extractTags(contentEl: HTMLElement): string[] {
  const tags: string[] = [];
  for (const p of contentEl.querySelectorAll('p')) {
    const txt = p.text.trim();
    if (txt && txt.split(/\s+/).every((w) => w.startsWith('#'))) {
      for (const w of txt.split(/\s+/)) tags.push(w.slice(1));
      p.remove();
    }
  }
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
  const children = contentEl.childNodes.filter((n) => 'tagName' in n) as HTMLElement[];
  if (children.length === 1 && children[0]?.tagName === 'UL') {
    const items = children[0].querySelectorAll('li').map((li) => li.text.trim()).filter(Boolean);
    if (items.length) return { kind: 'list', items };
  }

  const paras: string[] = [];
  for (const p of contentEl.querySelectorAll('p')) {
    const t = p.text.trim();
    if (t) paras.push(t);
  }
  if (!paras.length) return contentEl.text.trim();
  if (paras.length === 1) return paras[0]!;
  return paras.join('\n\n');
}

/**
 * flomo time 字段如 "2026-01-16 08:12:34" → { date, time, id }
 * id 格式 yyyymmdd-hhmmss，稳定、排序友好、URL 友好。
 */
function parseStamp(raw: string): { date: string; time: string; id: string } | null {
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) {
    // 容忍 flomo 偶发不带秒
    const m2 = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
    if (!m2) return null;
    const date = `${m2[1]}-${m2[2]}-${m2[3]}`;
    const hh = m2[4] ?? '00';
    const mm = m2[5] ?? '00';
    return {
      date,
      time: `${hh}:${mm}`,
      id: `${m2[1]}${m2[2]}${m2[3]}-${hh}${mm}00`,
    };
  }
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  return {
    date,
    time: `${m[4]}:${m[5]}`,
    id: `${m[1]}${m[2]}${m[3]}-${m[4]}${m[5]}${m[6]}`,
  };
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

async function syncTab(tab: (typeof TABS)[number], deleted: Set<string>) {
  const src = join(SYNC_DIR, tab.dir, '阿鸭的笔记.html');
  const outDir = join(OUT_DIR, tab.id);

  if (!existsSync(src)) {
    console.warn(`[sync] ${tab.id} ← 源文件不存在：${src} —— 跳过`);
    return { tab: tab.id, count: 0, skipped: 0 };
  }

  const html = readFileSync(src, 'utf8');
  const raw = extractMemos(html);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const seen = new Map<string, number>(); // id → 出现次数（处理极罕见的同秒冲突）
  let written = 0;
  let skipped = 0;

  for (const { time, contentEl } of raw) {
    const stamp = parseStamp(time);
    if (!stamp) continue;

    // 同秒冲突：追加 -02 / -03 …
    let id = stamp.id;
    const n = (seen.get(stamp.id) ?? 0) + 1;
    seen.set(stamp.id, n);
    if (n > 1) id = `${stamp.id}-${String(n).padStart(2, '0')}`;

    // 删除保护
    const key = `${tab.id}/${id}`;
    if (deleted.has(key)) {
      skipped++;
      continue;
    }

    const tags = extractTags(contentEl);
    const body = nodeToBody(contentEl);
    if (typeof body === 'string' && !body) continue;
    if (typeof body !== 'string' && !body.items.length) continue;

    const md = toMarkdown({ id, tab: tab.id, date: stamp.date, time: stamp.time, tags, body });
    await writeFile(join(outDir, `${id}.md`), md, 'utf8');
    written++;
  }

  const suffix = skipped > 0 ? `（跳过 ${skipped} 条永久删除项）` : '';
  console.log(`[sync] ${tab.id} ← ${tab.dir}: ${written} 条${suffix}`);
  return { tab: tab.id, count: written, skipped };
}

async function main() {
  console.log(`[sync] FLOMO_SYNC_DIR = ${SYNC_DIR}`);
  if (!existsSync(SYNC_DIR)) {
    console.error(`[sync] 同步目录不存在。设置 FLOMO_SYNC_DIR 或把 flomo 导出放到 ${SYNC_DIR}`);
    process.exit(1);
  }
  const deleted = loadDeleted();
  if (deleted.size > 0) console.log(`[sync] 载入 deleted.txt：${deleted.size} 条永久跳过`);

  const results = await Promise.all(TABS.map((t) => syncTab(t, deleted)));
  const total = results.reduce((a, b) => a + b.count, 0);
  const totalSkipped = results.reduce((a, b) => a + b.skipped, 0);
  console.log(`[sync] 完成：生成 ${total} 条${totalSkipped > 0 ? `，跳过 ${totalSkipped} 条` : ''}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
