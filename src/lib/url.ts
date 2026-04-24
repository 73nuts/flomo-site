/**
 * 生成带 base 前缀的站内 URL。
 *
 * Astro 构建时知道 base（来自 astro.config.mjs），
 * 但不会自动给 `href="/xxx"` 加前缀，需要手动拼。
 *
 * 用法：
 *   url('')             → "/flomo-site/"  (当 base=/flomo-site)
 *   url('jg')           → "/flomo-site/jg"
 *   url('jg/jg0')       → "/flomo-site/jg/jg0"
 *   url('avatar.jpg')   → "/flomo-site/avatar.jpg"
 */
export function url(path: string): string {
  // BASE_URL 可能带或不带尾斜杠（视 astro.config.mjs 配置），统一处理
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}
