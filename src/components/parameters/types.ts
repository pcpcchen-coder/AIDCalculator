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
  blurb: string;
}

/** 分類圖示與一句話說明（資料驅動，未知分類走 fallback） */
const CATEGORY_META: Record<string, CategoryMeta> = {
  架構與設計: { icon: Gauge, blurb: '安全餘裕、pod 佈局與列級規劃的一般參數' },
  一般: { icon: Gauge, blurb: '安全餘裕、標準機架與 pod 佈局等一般參數' },
  'IT 模型': { icon: Cpu, blurb: '機架規格正規化與 HPC／Cloud 換算假設' },
  運算: { icon: Cpu, blurb: 'HPC 換算比、GPU 利用率等運算假設' },
  儲存: { icon: HardDrive, blurb: '儲存功率占比、IOPS/TFLOPS 與儲存節點規格' },
  儲存估算: { icon: HardDrive, blurb: '儲存功率占比、IOPS/TFLOPS 與儲存節點規格' },
  冷卻: { icon: Snowflake, blurb: '乾冷／蒸散模式假設與 CDU 逼近溫差' },
  配電: { icon: Zap, blurb: 'UPS 預設效率、PDU 損耗與電壓層級' },
  冷卻與配電設備: { icon: Boxes, blurb: '冷卻與配電基礎設施相關參數' },
  空間: { icon: Ruler, blurb: 'λ 維護通道占比與 Gray space 係數' },
  冗餘: { icon: Layers, blurb: 'N+r／xN-y 冗餘語彙相關參數' },
  自訂: { icon: Sparkles, blurb: '使用者新增的參數，可被自訂算法以 key 引用' },
  自訂參數: { icon: Sparkles, blurb: '使用者新增的參數，可被自訂算法以 key 引用' },
};

const FALLBACK_META: CategoryMeta = { icon: SlidersHorizontal, blurb: '全域模型參數' };

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK_META;
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
