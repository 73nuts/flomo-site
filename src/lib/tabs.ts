/**
 * 标签定义 —— 单一真源。
 * 改颜色 / 改名 / 增删标签只在这里动，前端一切从这里导入。
 */
export type TabId = 'jg' | 'ds' | 'qh' | 'gd' | 'wa';

export interface Tab {
  readonly id: TabId;
  readonly name: string;
  readonly subtitle: string;
  /** flomo 导出子目录名：SYNC_DIR/<dir>/阿鸭的笔记.html */
  readonly dir: string;
  /** hex accent，应用于 ribbon / tape / hover */
  readonly accent: string;
  /** 用 rgb() 方便半透明：`rgba(var(--accent-rgb), 0.1)` */
  readonly accentRgb: string;
}

export const TABS = [
  { id: 'jg', name: '吉光片羽', subtitle: 'random thoughts',  dir: 'jiguang', accent: '#c9a063', accentRgb: '201,160,99'  },
  { id: 'ds', name: '读书笔记', subtitle: 'from the margins', dir: 'dushu',   accent: '#8a9aa8', accentRgb: '138,154,168' },
  { id: 'qh', name: '阿鸭情话', subtitle: 'for you',          dir: 'qinghua', accent: '#c77f8a', accentRgb: '199,127,138' },
  { id: 'gd', name: '灌点鸭汤', subtitle: 'a warm sip',       dir: 'gd',      accent: '#b88660', accentRgb: '184,134,96'  },
  { id: 'wa', name: '晚安计划', subtitle: 'before sleep',     dir: 'wa',      accent: '#7a8aa0', accentRgb: '122,138,160' },
] as const satisfies readonly Tab[];

export const TAB_BY_ID = Object.fromEntries(TABS.map((t) => [t.id, t])) as Record<TabId, Tab>;
