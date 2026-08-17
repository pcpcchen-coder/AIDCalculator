import type {
  DatacenterResult,
  DatacenterType,
  EquipmentDesignEntry,
  GenerateInput,
  GenerateResult,
  HeatRejectionMode,
  NonItResult,
  OptimizationCriterion,
  RedundancyMap,
} from '@contracts/dcgen';
import { DATACENTER_TYPE_LABELS, DEFAULT_REDUNDANCY } from '@contracts/dcgen';

// ---------------- 表單狀態 ----------------
export type TargetMode = 'racks' | 'power';

export interface FormState {
  datacenterUseCase: DatacenterType;
  targetMode: TargetMode;
  rackCount: number;
  powerMw: number;
  model: 'Canonical' | 'Reference';
  generation: string; // "2024" | "2027" | "2029" | "All"
  specificDatacenters: string[]; // 空陣列 = "All"
  heatRejectionMode: HeatRejectionMode;
  optimizationCriteria: OptimizationCriterion[];
  safetyMargin: number; // 0–1
  rackPerRow: number;
  rowsPerPod: number;
  redundancy: RedundancyMap;
}

export const DEFAULT_FORM: FormState = {
  datacenterUseCase: 'AI training',
  targetMode: 'power',
  rackCount: 1000,
  powerMw: 50,
  model: 'Canonical',
  generation: '2027',
  specificDatacenters: [],
  heatRejectionMode: 'Dry cooling',
  optimizationCriteria: ['Space'],
  safetyMargin: 0.2,
  rackPerRow: 10,
  rowsPerPod: 2,
  redundancy: { ...DEFAULT_REDUNDANCY },
};

/** URL query ?type=ai-training|ai-inference|mixed|cloud → DatacenterType */
export const QUERY_TYPE_MAP: Record<string, DatacenterType> = {
  'ai-training': 'AI training',
  'ai-inference': 'AI inference',
  mixed: 'Mixed AI training and inference',
  cloud: 'Cloud',
};

/** 由表單狀態組出後端 GenerateInput */
export function buildGenerateInput(form: FormState): GenerateInput {
  return {
    datacenterUseCase: form.datacenterUseCase,
    datacenterScale:
      form.targetMode === 'racks'
        ? { target: 'rack_count', capacity: Math.max(1, Math.round(form.rackCount)) }
        : { target: 'power_capacity', capacity: `${form.powerMw}MW` },
    model: form.model,
    generation: form.model === 'Canonical' ? form.generation : 'All',
    specificDatacenters:
      form.model === 'Reference' && form.specificDatacenters.length > 0
        ? form.specificDatacenters
        : 'All',
    heatRejectionMode: form.heatRejectionMode,
    optimizationCriteria: form.optimizationCriteria,
    rackPerRow: Math.max(1, Math.round(form.rackPerRow)),
    rowsPerPod: Math.max(1, Math.round(form.rowsPerPod)),
    safetyMargin: form.safetyMargin,
    redundancy: form.redundancy,
  };
}

/** 由 GenerateInput 還原表單狀態（載入已存情境用） */
export function formStateFromInput(input: GenerateInput): FormState {
  const scale = input.datacenterScale;
  let powerMw = DEFAULT_FORM.powerMw;
  if (scale.target === 'power_capacity') {
    const m = /^([\d.]+)\s*(MW|GW|kW)$/i.exec(scale.capacity.trim());
    if (m) {
      const v = parseFloat(m[1]);
      const unit = m[2].toUpperCase();
      powerMw = unit === 'GW' ? v * 1000 : unit === 'KW' ? v / 1000 : v;
    }
  }
  return {
    datacenterUseCase: input.datacenterUseCase,
    targetMode: scale.target === 'rack_count' ? 'racks' : 'power',
    rackCount: scale.target === 'rack_count' ? scale.capacity : DEFAULT_FORM.rackCount,
    powerMw,
    model: input.model,
    generation: input.generation ?? 'All',
    specificDatacenters:
      input.specificDatacenters === 'All' ? [] : [...input.specificDatacenters],
    heatRejectionMode: input.heatRejectionMode,
    optimizationCriteria: [...input.optimizationCriteria],
    safetyMargin: input.safetyMargin,
    rackPerRow: input.rackPerRow,
    rowsPerPod: input.rowsPerPod,
    redundancy: { ...input.redundancy },
  };
}

// ---------------- 冗餘 ----------------
export const REDUNDANCY_PRESETS = ['N', 'N+1', 'N+2', '2N'] as const;

export function isPresetRedundancy(v: string): boolean {
  return (REDUNDANCY_PRESETS as readonly string[]).includes(v);
}

/** 解析 xN/y（或 xN、N/y）→ { x, y }；非自訂格式回 null */
export function parseCustomRedundancy(v: string): { x: number; y: number } | null {
  const s = v.trim().toUpperCase();
  let m = /^(\d+)N\/(\d+)$/.exec(s);
  if (m) return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
  m = /^(\d+)N$/.exec(s);
  if (m && s !== 'N') {
    const x = parseInt(m[1], 10);
    if (x > 1) return { x, y: 1 };
  }
  m = /^N\/(\d+)$/.exec(s);
  if (m) return { x: 1, y: parseInt(m[1], 10) };
  return null;
}

/** xN/y 有效容量比例（y/x） */
export function effectiveCapacityRatio(v: string): number | null {
  const c = parseCustomRedundancy(v);
  if (!c || c.x <= 0) return null;
  return c.y / c.x;
}

// ---------------- 格式化 ----------------
export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtMw(n: number): string {
  return n >= 100 ? fmt(n, 0) : n >= 10 ? fmt(n, 1) : fmt(n, 2);
}

export function fmtDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CHART_COLORS = ['#22D3EE', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#64748B'];

export const TYPE_BADGE_CLASS: Record<DatacenterType, string> = {
  'AI training': 'border-accent/50 bg-accent/10 text-accent',
  'AI inference': 'border-cool/50 bg-cool/10 text-cool',
  'Mixed AI training and inference': 'border-violet/50 bg-violet/10 text-violet',
  Cloud: 'border-text-2/50 bg-bg-3 text-text-1',
};

export function typeLabel(t: DatacenterType): string {
  return DATACENTER_TYPE_LABELS[t];
}

export function isDeltaVendor(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  const v = vendor.toLowerCase();
  return v.includes('台達') || v.includes('delta');
}

// ---------------- 結果衍生數據 ----------------
export interface DerivedMetrics {
  itMw: number;
  coolingMw: number;
  lossMw: number;
  totalMw: number;
  safetyReserveMw: number;
  whiteSpaceM2: number;
  grayIndoorM2: number;
  grayOutdoorM2: number;
  equipmentCount: number;
}

/** 彙總單一 DatacenterResult + 選定 criterion 的核心指標 */
export function deriveMetrics(
  dc: DatacenterResult,
  nonIt: NonItResult | undefined,
  safetyMargin: number,
): DerivedMetrics {
  const itMw = dc.it.totalPeakPowerMw;
  const coolingMw = nonIt?.cooling.summary.powerMw ?? 0;
  const lossMw = nonIt?.power.summary.powerMw ?? 0;
  const grayIndoorM2 =
    (nonIt?.cooling.summary.spaceIndoorM2 ?? 0) + (nonIt?.power.summary.spaceIndoorM2 ?? 0);
  const grayOutdoorM2 =
    (nonIt?.cooling.summary.spaceOutdoorM2 ?? 0) + (nonIt?.power.summary.spaceOutdoorM2 ?? 0);
  let equipmentCount = 0;
  if (nonIt) {
    for (const group of [nonIt.cooling.designs, nonIt.power.designsIt, nonIt.power.designsFacility]) {
      for (const d of Object.values(group)) {
        if (d) equipmentCount += d.totalCount;
      }
    }
  }
  return {
    itMw,
    coolingMw,
    lossMw,
    totalMw: itMw + coolingMw + lossMw,
    safetyReserveMw: itMw * safetyMargin,
    whiteSpaceM2: dc.it.spaceM2,
    grayIndoorM2,
    grayOutdoorM2,
    equipmentCount,
  };
}

/** 取結果中第一個（或指定）criterion 的 NonItResult */
export function pickNonIt(dc: DatacenterResult, criterion?: OptimizationCriterion): NonItResult | undefined {
  if (!dc.nonIt.length) return undefined;
  if (!criterion) return dc.nonIt[0];
  return dc.nonIt.find((n) => n.criterion === criterion) ?? dc.nonIt[0];
}

// ---------------- 匯出 ----------------
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportResultJson(result: GenerateResult) {
  downloadBlob(JSON.stringify(result, null, 2), `dcgen-result-${Date.now()}.json`, 'application/json');
}

interface BomRow {
  system: string;
  stage: string;
  category: string;
  entry: EquipmentDesignEntry;
}

export function collectBomRows(nonIt: NonItResult | undefined): BomRow[] {
  const rows: BomRow[] = [];
  if (!nonIt) return rows;
  for (const [cat, entry] of Object.entries(nonIt.cooling.designs)) {
    if (entry) rows.push({ system: '冷卻', stage: 'IT', category: cat, entry });
  }
  for (const [cat, entry] of Object.entries(nonIt.power.designsIt)) {
    if (entry) rows.push({ system: '配電', stage: 'IT 階段', category: cat, entry });
  }
  for (const [cat, entry] of Object.entries(nonIt.power.designsFacility)) {
    if (entry) rows.push({ system: '配電', stage: '廠務階段', category: cat, entry });
  }
  return rows;
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportResultCsv(result: GenerateResult) {
  const header = ['配置', '優化目標', '系統', '階段', '設備類別', '型號', '廠商', '數量', '容量(MW)', '功耗/損耗(MW)', '空間(m2)'];
  const lines = [header.join(',')];
  for (const dc of result.results) {
    for (const nonIt of dc.nonIt) {
      for (const r of collectBomRows(nonIt)) {
        lines.push(
          [
            dc.configName,
            nonIt.criterion,
            r.system,
            r.stage,
            r.category,
            r.entry.name,
            r.entry.vendor ?? '',
            r.entry.totalCount,
            r.entry.totalCapacityMw,
            r.entry.maxPowerDemandMw ?? r.entry.maxConversionPowerMw ?? '',
            r.entry.spaceM2 ?? '',
          ]
            .map(csvEscape)
            .join(','),
        );
      }
    }
  }
  downloadBlob('﻿' + lines.join('\n'), `dcgen-bom-${Date.now()}.csv`, 'text/csv;charset=utf-8');
}
