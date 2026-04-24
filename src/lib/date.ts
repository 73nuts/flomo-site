/**
 * 日期格式化 —— 纯函数，前后端共用。
 */
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'] as const;
const MONTH_EN_CAP = MONTH_EN.map((m) => m.toUpperCase()) as readonly string[];

export interface ParsedDate {
  y: number;
  m: number;
  d: number;
}

export function parseDate(iso: string): ParsedDate {
  const [y, m, d] = iso.split('-').map(Number);
  return { y: y ?? 0, m: m ?? 1, d: d ?? 1 };
}

/** 2026-01-16 → "Jan 16, 2026" */
export function fmtDate(iso: string): string {
  const { y, m, d } = parseDate(iso);
  return `${MONTH_EN[m - 1]} ${d}, ${y}`;
}

/** 2026-01-16 → { cn: "一 月", en: "JAN 2026" } */
export function fmtMonth(iso: string): { cn: string; en: string } {
  const { y, m } = parseDate(iso);
  return {
    cn: `${MONTH_CN[m - 1]} 月`,
    en: `${MONTH_EN_CAP[m - 1]} ${y}`,
  };
}

/** 同月分组 key：2026-01 */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
