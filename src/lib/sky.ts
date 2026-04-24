/**
 * 根据系统当前小时返回天空色调 key。
 * morning / afternoon / dusk / night —— 对应 CSS 里的 .sky.<key>
 */
export type SkyMood = 'morning' | 'afternoon' | 'dusk' | 'night';

export function skyFromHour(h: number): SkyMood {
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 16) return 'afternoon';
  if (h < 20) return 'dusk';
  return 'night';
}
