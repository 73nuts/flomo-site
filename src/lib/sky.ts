/**
 * 根据系统当前小时返回天空色调 key。
 * midnight / morning / afternoon / dusk / night —— 对应 CSS 里的 .sky.<key>
 * midnight (00-04) 是彩蛋：深夜星空色。
 */
export type SkyMood = 'midnight' | 'morning' | 'afternoon' | 'dusk' | 'night';

/**
 * 时段边界（24h）：
 *   midnight  00:00 - 04:59  深夜彩蛋（星空 + 月亮）
 *   morning   05:00 - 10:59  晨光（清冷蓝紫余韵 + 桃粉初阳）
 *   afternoon 11:00 - 16:59  午后（明亮金黄）
 *   dusk      17:00 - 19:59  黄昏（暖橙粉米）
 *   night     20:00 - 23:59  夜幕（深蓝灰 → 米白）
 *
 * 旧版 night 单独覆盖 5:00 一小时（孤立段）+ 20-23 点，会让 5 点醒来访问看到深蓝，
 * 5:00 一过又跳到 morning，体验跳跃。新版把 5:00 并入 morning。
 */
export function skyFromHour(h: number): SkyMood {
  if (h < 5) return 'midnight';
  if (h < 11) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 20) return 'dusk';
  return 'night';
}

export function isMidnightHour(h: number): boolean {
  return h < 5;
}
