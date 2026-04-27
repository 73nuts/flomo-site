/**
 * 搜索索引 endpoint —— 构建期生成 /find-index.json，
 * /find 页客户端 fetch 一次后做纯字符串模糊匹配。
 *
 * 索引内容：每条 memo → {id, tab, date, text, from?, title?}
 * text 是剥掉 markdown 后的纯文本，截 280 字以内。
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function stripMd(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]+/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const memos = await getCollection('memos');
  const entries = memos
    .map((m) => ({
      id: m.data.id,
      tab: m.data.tab,
      date: m.data.date,
      from: m.data.from,
      title: m.data.title,
      text: stripMd(m.body || '').slice(0, 280),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
