import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 每条 memo 是一个 markdown 文件。
 * 正文是 body，frontmatter 描述 tab / 日期 / 归属。
 */
const memos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/memos' }),
  schema: z.object({
    id: z.string(),
    tab: z.enum(['jg', 'ds', 'qh', 'gd', 'wa']),
    /** ISO 8601 date: YYYY-MM-DD */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** HH:MM（可空） */
    time: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** 引用来源（书名 / 作者），可选 */
    from: z.string().optional(),
  }),
});

export const collections = { memos };
