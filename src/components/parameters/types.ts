import {
  Gauge,
  HardDrive,
  Cpu,
  Snowflake,
  Zap,
  Ruler,
  Sparkles,
  SlidersHorizontal,
  Boxes,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** 後端 parameters.list 列形狀（僅保留前端需要的欄位） */
export interface ParamItem {
  id: number;
  key: string;
  value: number;
  defaultValue: number;
  unit: string | null;
  category: string;
  description: string | null;
  isCustom: boolean;
}

/** 後端 parameters.audits 列形狀 */
export interface AuditItem {
  id: number;
  parameterKey: string;
  oldValue: number | null;
  newValue: number;
  action: string; // update | create | reset | delete
  createdAt: Date | string;
}

export interface CategoryMeta {
  icon: LucideIcon;
}

/** 分類圖示（資料驅動，未知分類走 fallback） */
const CATEGORY_META: Record<string, CategoryMeta> = {
  架構與設計: { icon: Gauge },
  一般: { icon: Gauge },
  'IT 模型': { icon: Cpu },
  運算: { icon: Cpu },
  儲存: { icon: HardDrive },
  儲存估算: { icon: HardDrive },
  冷卻: { icon: Snowflake },
  配電: { icon: Zap },
  冷卻與配電設備: { icon: Boxes },
  空間: { icon: Ruler },
  冗餘: { icon: Layers },
  自訂: { icon: Sparkles },
  自訂參數: { icon: Sparkles },
};

const FALLBACK_META: CategoryMeta = { icon: SlidersHorizontal };

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK_META;
}

/** DB 分類中文值 → i18n key slug（名稱與說明共用 slug） */
const CATEGORY_SLUGS: Record<string, string> = {
  架構與設計: 'architecture',
  一般: 'general',
  'IT 模型': 'itModel',
  運算: 'compute',
  儲存: 'storage',
  儲存估算: 'storageEst',
  冷卻: 'cooling',
  配電: 'powerDist',
  冷卻與配電設備: 'coolingPower',
  空間: 'space',
  冗餘: 'redundancy',
  冗餘計數: 'redundancyCount',
  'IT 功率': 'itPower',
  'IT 空間': 'itSpace',
  自訂: 'custom',
  自訂參數: 'customParam',
  自訂算法: 'customAlgo',
};

type Translate = (key: string) => string;

/** 分類顯示名（未知分類回退 DB 原文） */
export function categoryLabel(t: Translate, category: string): string {
  const slug = CATEGORY_SLUGS[category];
  return slug ? t(`params.cat.${slug}`) : category;
}

/** 分類一句話說明（未知分類走 fallback 說明） */
export function categoryBlurb(t: Translate, category: string): string {
  const slug = CATEGORY_SLUGS[category];
  return t(slug ? `params.catBlurb.${slug}` : 'params.catBlurb.fallback');
}

/** 自訂分類固定排在最後，其餘依偏好順序，未知分類插在中間 */
const CATEGORY_ORDER = [
  '架構與設計',
  '一般',
  'IT 模型',
  '運算',
  '儲存估算',
  '儲存',
  '冷卻',
  '配電',
  '冷卻與配電設備',
  '空間',
  '冗餘',
];

export function isCustomCategory(category: string): boolean {
  return category === '自訂' || category === '自訂參數';
}

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ca = isCustomCategory(a) ? 999 : (CATEGORY_ORDER.indexOf(a) === -1 ? 500 : CATEGORY_ORDER.indexOf(a));
    const cb = isCustomCategory(b) ? 999 : (CATEGORY_ORDER.indexOf(b) === -1 ? 500 : CATEGORY_ORDER.indexOf(b));
    return ca - cb || a.localeCompare(b, 'zh-Hant');
  });
}

/** 數值格式化：大數加千分位、小數去尾零 */
export function fmtNum(n: number, maxDecimals = 6): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  const fixed = n.toFixed(maxDecimals).replace(/0+$/, '').replace(/\.$/, '');
  const [int, dec] = fixed.split('.');
  const withSep = Number(int).toLocaleString('en-US');
  return dec ? `${withSep}.${dec}` : withSep;
}

export function isModified(p: ParamItem): boolean {
  return Math.abs(p.value - p.defaultValue) > 1e-9;
}

export function isBoolParam(p: ParamItem): boolean {
  return p.unit === 'bool';
}

export function isRatioParam(p: ParamItem): boolean {
  return p.unit === 'ratio' || p.unit === '%';
}

/** 參數 key 驗證（同後端 zod） */
export const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
