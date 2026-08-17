import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../api/router';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  COOLING_CATEGORIES,
  DATACENTER_TYPES,
  DATACENTER_TYPE_LABELS,
} from '@contracts/dcgen';
import type { EquipmentCategory, DatacenterType } from '@contracts/dcgen';

// ---------------- tRPC 推斷型別 ----------------
type RouterOutputs = inferRouterOutputs<AppRouter>;
export type EquipmentRow = RouterOutputs['catalog']['list'][number];
export type ItConfigRow = RouterOutputs['itConfig']['list'][number];
export type VendorRow = RouterOutputs['catalog']['vendors'][number];
export type StatsResult = RouterOutputs['stats']['get'];

export {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  COOLING_CATEGORIES,
  DATACENTER_TYPES,
  DATACENTER_TYPE_LABELS,
};
export type { EquipmentCategory, DatacenterType };

// ---------------- 分類視覺（catalog.md §3.2：8 類各色） ----------------
export interface CategoryMeta {
  /** 膠囊短標籤（工具列） */
  short: string;
  /** 徽章文字色 / 邊框色 / 底色 class */
  badge: string;
  /** 迷你色點 */
  dot: string;
}

export const CATEGORY_META: Record<EquipmentCategory, CategoryMeta> = {
  cdu: {
    short: 'CDU',
    badge: 'border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]',
    dot: 'bg-[#38BDF8]',
  },
  chiller: {
    short: 'Chillers',
    badge: 'border-accent/50 bg-accent/10 text-accent',
    dot: 'bg-accent',
  },
  dry_cooler: {
    short: 'Dry coolers',
    badge: 'border-[#2DD4BF]/50 bg-[#2DD4BF]/10 text-[#2DD4BF]',
    dot: 'bg-[#2DD4BF]',
  },
  cooling_tower: {
    short: 'Evap. Towers',
    badge: 'border-[#60A5FA]/50 bg-[#60A5FA]/10 text-[#60A5FA]',
    dot: 'bg-[#60A5FA]',
  },
  pdu: {
    short: 'PDUs',
    badge: 'border-power/50 bg-power/10 text-power',
    dot: 'bg-power',
  },
  ups: {
    short: 'UPSs',
    badge: 'border-green/50 bg-green/10 text-green',
    dot: 'bg-green',
  },
  msb: {
    short: 'MSBs',
    badge: 'border-violet/50 bg-violet/10 text-violet',
    dot: 'bg-violet',
  },
  generator: {
    short: 'Backup Generators',
    badge: 'border-red/50 bg-red/10 text-red',
    dot: 'bg-red',
  },
};

/** 冷卻類 → 顯示峰值功耗；配電類 → 顯示效率 */
export const isCoolingCategory = (c: string): boolean =>
  (COOLING_CATEGORIES as readonly string[]).includes(c);

// ---------------- URL slug 映射（dry-cooler → dry_cooler） ----------------
export const categoryToSlug = (c: EquipmentCategory): string => c.replace(/_/g, '-');
export const slugToCategory = (slug: string): EquipmentCategory | null => {
  const normalized = slug.replace(/-/g, '_');
  return (EQUIPMENT_CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as EquipmentCategory)
    : null;
};

// ---------------- 台達電子判斷 ----------------
export const isDeltaVendor = (vendorName: string | null | undefined): boolean =>
  !!vendorName && /delta|台達/i.test(vendorName);

// ---------------- DC 類型徽章色 ----------------
export const DC_TYPE_BADGE: Record<DatacenterType, string> = {
  'AI training': 'border-accent/50 bg-accent/10 text-accent',
  'AI inference': 'border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]',
  'Mixed AI training and inference': 'border-violet/50 bg-violet/10 text-violet',
  Cloud: 'border-green/50 bg-green/10 text-green',
};

export const RACK_TYPE_LABELS: Record<string, string> = {
  Cloud: '標準機架',
  HPC: '液冷機架',
};

// ---------------- i18n key 映射（列舉值 → dict key；顯示文字由各語言字典提供） ----------------
export const DC_TYPE_I18N_KEYS: Record<DatacenterType, string> = {
  'AI training': 'catalog.dcType.aiTraining',
  'AI inference': 'catalog.dcType.aiInference',
  'Mixed AI training and inference': 'catalog.dcType.mixed',
  Cloud: 'catalog.dcType.cloud',
};

export const DC_TYPE_SHORT_I18N_KEYS: Record<DatacenterType, string> = {
  'AI training': 'catalog.dcTypeShort.aiTraining',
  'AI inference': 'catalog.dcTypeShort.aiInference',
  'Mixed AI training and inference': 'catalog.dcTypeShort.mixed',
  Cloud: 'catalog.dcTypeShort.cloud',
};

// ---------------- 格式化 ----------------
export const fmtNum = (n: number | null | undefined, digits = 0): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const fmtKw = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const fmtDim = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : String(Number(n.toFixed(3)));

export const urlDomain = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

// ---------------- CSV 匯出 ----------------
const csvEscape = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');

export const downloadFile = (filename: string, content: string, mime: string) => {
  // CSV 加 BOM 讓 Excel 正確辨識 UTF-8；JSON 不加
  const body = mime === 'text/csv' ? '﻿' + content : content;
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
