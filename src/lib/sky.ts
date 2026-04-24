/**
 * 根据系统当前小时返回天空色调 key。
 * midnight / morning / afternoon / dusk / night —— 对应 CSS 里的 .sky.<key>
 * midnight (00-04) 是彩蛋：深夜星空色。
 */
export type SkyMood = 'midnight' | 'morning' | 'afternoon' | 'dusk' | 'night';

export function skyFromHour(h: number): SkyMood {
  if (h < 5) return 'midnight';
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 16) return 'afternoon';
  if (h < 20) return 'dusk';
  return 'night';
}

export function isMidnightHour(h: number): boolean {
  return h < 5;
}
