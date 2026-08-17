import { HardDrive, Cpu, Snowflake, Zap, Layers, Gauge, Sparkles, FunctionSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** 後端 algorithms.list 列形狀（僅保留前端需要的欄位） */
export interface AlgoItem {
  id: number;
  key: string;
  name: string;
  category: string;
  description: string | null;
  formula: string | null;
  formulaDisplay: string | null;
  paperRef: string | null;
  parameterBindings: string | null; // JSON: { varName: parameterKey }
  isBuiltin: boolean;
  enabled: boolean;
  version: string;
}

/** 參考 parameters.list 供綁定下拉與試算預填 */
export interface ParamOption {
  key: string;
  value: number;
  unit: string | null;
  category: string;
  description: string | null;
}

export function parseBindings(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(([, v]) => typeof v === 'string'),
      ) as Record<string, string>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

/** 從公式擷取變數（與後端 extractVariables 同規則的輕量版） */
const FUNCTIONS = new Set([
  'ceil', 'floor', 'round', 'sqrt', 'abs', 'min', 'max', 'log', 'log10', 'exp', 'pow', 'sum',
]);

export function extractVariables(formula: string | null | undefined): string[] {
  if (!formula) return [];
  const names = new Set<string>();
  const re = /[A-Za-z_][A-Za-z0-9_]*\s*(\()?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    if (m[1]) continue; // 函數呼叫
    if (FUNCTIONS.has(m[0].trim())) continue;
    names.add(m[0].trim());
  }
  return [...names];
}

interface AlgoCategoryMeta {
  icon: LucideIcon;
  color: string; // tailwind text class
}

const ALGO_CATEGORY_META: Record<string, AlgoCategoryMeta> = {
  儲存估算: { icon: HardDrive, color: 'text-cool' },
  儲存: { icon: HardDrive, color: 'text-cool' },
  'IT 模型': { icon: Cpu, color: 'text-accent' },
  'IT 功率': { icon: Cpu, color: 'text-accent' },
  'IT 空間': { icon: Gauge, color: 'text-accent' },
  冷卻: { icon: Snowflake, color: 'text-cool' },
  配電: { icon: Zap, color: 'text-violet' },
  冷卻與配電設備: { icon: Snowflake, color: 'text-cool' },
  冗餘: { icon: Layers, color: 'text-power' },
  冗餘計數: { icon: Layers, color: 'text-power' },
  架構與設計: { icon: Gauge, color: 'text-green' },
  自訂: { icon: Sparkles, color: 'text-violet' },
  自訂算法: { icon: Sparkles, color: 'text-violet' },
};

export function algoCategoryMeta(category: string): AlgoCategoryMeta {
  return ALGO_CATEGORY_META[category] ?? { icon: FunctionSquare, color: 'text-text-1' };
}

/** DB 分類中文值 → i18n key slug */
const ALGO_CATEGORY_SLUGS: Record<string, string> = {
  儲存估算: 'storageEst',
  儲存: 'storage',
  'IT 模型': 'itModel',
  'IT 功率': 'itPower',
  'IT 空間': 'itSpace',
  冷卻: 'cooling',
  配電: 'powerDist',
  冷卻與配電設備: 'coolingPower',
  冗餘: 'redundancy',
  冗餘計數: 'redundancyCount',
  架構與設計: 'architecture',
  自訂: 'custom',
  自訂算法: 'customAlgo',
};

/** 分類顯示名（未知分類回退 DB 原文） */
export function algoCategoryLabel(t: (key: string) => string, category: string): string {
  const slug = ALGO_CATEGORY_SLUGS[category];
  return slug ? t(`params.cat.${slug}`) : category;
}

const ALGO_CATEGORY_ORDER = [
  '儲存估算',
  '儲存',
  'IT 模型',
  'IT 功率',
  'IT 空間',
  '架構與設計',
  '冷卻',
  '配電',
  '冷卻與配電設備',
  '冗餘',
  '冗餘計數',
];

export function isCustomAlgoCategory(category: string): boolean {
  return category === '自訂' || category === '自訂算法';
}

export function sortAlgoCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ca = isCustomAlgoCategory(a) ? 999 : (ALGO_CATEGORY_ORDER.indexOf(a) === -1 ? 500 : ALGO_CATEGORY_ORDER.indexOf(a));
    const cb = isCustomAlgoCategory(b) ? 999 : (ALGO_CATEGORY_ORDER.indexOf(b) === -1 ? 500 : ALGO_CATEGORY_ORDER.indexOf(b));
    return ca - cb || a.localeCompare(b, 'zh-Hant');
  });
}

/** 演算法 key 驗證（同後端 zod） */
export const ALGO_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
