/**
 * DCGen 演算引擎（TypeScript 移植）
 * 依據 arXiv:2604.09616（DCGen 1.1）與 github.com/WedanEmmanuel/DCGen 的
 * IT_configuration.py / Cooling_Power_Infrastructures.py 實作式 1–19。
 */
import type {
  DatacenterResult,
  EquipmentCategory,
  EquipmentDesignEntry,
  GenerateInput,
  ItResult,
  NonItResult,
  OptimizationCriterion,
} from "../../contracts/dcgen";
import {
  COOLING_CATEGORIES,
  OUTDOOR_CATEGORIES,
  REDUNDANCY_SLOTS,
  ROW_LEVEL_CATEGORIES,
} from "../../contracts/dcgen";

// ---------------- 輸入資料結構 ----------------
export interface EngineItConfig {
  id: number;
  name: string;
  datacenterType: string;
  model: string;
  rackSize: number;
  rackType: string; // Cloud | HPC
  floorSpace: number;
  generation: string;
  nodeTypes: { nodeType: string; rackCount: number; rackTdp: number }[];
}

export interface EngineEquipment {
  id: number;
  name: string;
  vendorName: string | null;
  category: string;
  capacityKw: number;
  peakPowerConsumptionKw: number | null;
  efficiency: number | null;
  heightM: number | null;
  widthM: number | null;
  depthM: number | null;
  accessAreaShare: number;
}

export type EngineParams = Record<string, number>;

// ---------------- 冗餘解析（N+r / xN/y / xN / N/y / N） ----------------
type Redundancy =
  | { type: "N+r"; r: number }
  | { type: "xN/y"; x: number; y: number };

export function parseRedundancy(stream: string): Redundancy | null {
  const s = stream.trim();
  let m = /^N\s*\+\s*(\d+)$/.exec(s);
  if (m) return { type: "N+r", r: parseInt(m[1], 10) };
  m = /^(\d+)\s*N\s*\/\s*(\d+)$/.exec(s);
  if (m) return { type: "xN/y", x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
  m = /^(\d+)\s*N$/.exec(s);
  if (m) return { type: "xN/y", x: parseInt(m[1], 10), y: 1 };
  m = /^N\s*\/\s*(\d+)$/.exec(s);
  if (m) return { type: "xN/y", x: 1, y: parseInt(m[1], 10) };
  if (s === "N") return { type: "xN/y", x: 1, y: 1 };
  return null;
}

/** 解析功率字串（1MW / 500kW / 1GW ...）→ kW */
export function convertToKw(powerStr: string): number {
  const units: Record<string, number> = { W: 1e-3, KW: 1, MW: 1e3, GW: 1e6, TW: 1e9 };
  const m = /^([+-]?\d+(?:\.\d+)?)\s*(W|KW|MW|GW|TW)$/i.exec(powerStr.trim());
  if (!m) throw new Error(`無效功率格式: '${powerStr}'（支援 W/kW/MW/GW/TW）`);
  const value = parseFloat(m[1]);
  if (value <= 0) throw new Error("目標功率必須為正值");
  return value * units[m[2].toUpperCase()];
}

// ---------------- 二元最小堆（LPT 用） ----------------
class MinHeap<T> {
  private items: T[] = [];
  constructor(private key: (t: T) => number) {}
  get size() {
    return this.items.length;
  }
  push(item: T) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.key(this.items[p]) <= this.key(this.items[i])) break;
      [this.items[p], this.items[i]] = [this.items[i], this.items[p]];
      i = p;
    }
  }
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.items.length && this.key(this.items[l]) < this.key(this.items[smallest])) smallest = l;
        if (r < this.items.length && this.key(this.items[r]) < this.key(this.items[smallest])) smallest = r;
        if (smallest === i) break;
        [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

// ---------------- IT 模型（式 7–15） ----------------
export function computeItResult(
  config: EngineItConfig,
  input: GenerateInput,
  params: EngineParams,
): ItResult {
  const convRack = params["conventional_rack_size"] ?? 42;
  const hpcRatio = params["hpc_to_cloud_rack_ratio"] ?? 2 / 3;
  const isHpc = config.rackType === "HPC";
  const ratio = isHpc ? hpcRatio : 1;

  const refCounts = config.nodeTypes.map((nt) => Math.round(nt.rackCount));
  const total0 = refCounts.reduce((a, b) => a + b, 0);

  let counts: number[];
  let totalRacks: number;
  let powerDensity: number;
  let spaceM2: number;

  if (input.datacenterScale.target === "rack_count") {
    const target = Math.max(1, Math.round(input.datacenterScale.capacity));
    counts = refCounts.map((c0) => Math.round((target * c0) / total0));
    totalRacks = counts.reduce((a, b) => a + b, 0);
    // 修正四捨五入造成的總數誤差（Python：調整最後一個型別）
    const lastIdx = counts.length - 1;
    if (totalRacks > target) counts[lastIdx] -= totalRacks - target;
    if (totalRacks < target) counts[lastIdx] += target - totalRacks;
    totalRacks = target;

    powerDensity = 0;
    for (let i = 0; i < config.nodeTypes.length; i++) {
      powerDensity +=
        (counts[i] * ratio * convRack * config.nodeTypes[i].rackTdp) /
        (config.floorSpace * target * config.rackSize);
    }
    spaceM2 = round1(target * config.floorSpace);
  } else {
    const targetKw = convertToKw(input.datacenterScale.capacity);
    // 參考配置的功率密度（式 12）
    let density0 = 0;
    for (let i = 0; i < config.nodeTypes.length; i++) {
      density0 +=
        (refCounts[i] * ratio * convRack * config.nodeTypes[i].rackTdp) /
        (config.floorSpace * config.rackSize);
    }
    density0 /= total0;
    totalRacks = Math.round(targetKw / (density0 * config.floorSpace)); // 式 14
    counts = refCounts.map((c0) => Math.round((totalRacks * c0) / total0)); // 式 15a
    powerDensity = density0;
    spaceM2 = round1(targetKw / density0); // 式 13
  }

  const rackCount: Record<string, number> = {};
  const peakPowerMw: Record<string, number> = {};
  for (let i = 0; i < config.nodeTypes.length; i++) {
    const nt = config.nodeTypes[i];
    rackCount[nt.nodeType] = counts[i];
    peakPowerMw[nt.nodeType] = round3(
      (ratio * convRack * counts[i] * nt.rackTdp) / (1e3 * config.rackSize),
    );
  }

  const totalPeakPowerMw = Object.values(peakPowerMw).reduce((a, b) => a + b, 0);

  return {
    configName: config.name,
    generation: config.generation,
    rackCount,
    peakPowerMw,
    totalPeakPowerMw: round3(totalPeakPowerMw),
    totalRacks,
    powerDensityKwM2: round3(powerDensity),
    spaceM2,
  };
}

// ---------------- LPT pod 裝箱（§4.6.1） ----------------
export function arrangeRacksPerPod(
  it: ItResult,
  rackPerRow: number,
  rowsPerPod: number,
): { pods: number; maxPodPowerKw: number } {
  const rackPerPod = rowsPerPod * rackPerRow;
  const items: number[] = [];
  const types = Object.keys(it.rackCount);
  for (const t of types) {
    const n = Math.trunc(it.rackCount[t]);
    const pKw = it.peakPowerMw[t] * 1e3;
    if (n > 0 && pKw > 0) {
      const per = round1(pKw / n);
      for (let i = 0; i < n; i++) items.push(per);
    }
  }
  items.sort((a, b) => b - a);
  const N = items.length;
  if (N === 0) return { pods: 0, maxPodPowerKw: 0 };
  const R = Math.ceil(N / rackPerPod);

  const heap = new MinHeap<{ power: number; count: number; id: number }>((x) => x.power);
  const powers = new Array(R).fill(0);
  const counts = new Array(R).fill(0);
  for (let r = 0; r < R; r++) heap.push({ power: 0, count: 0, id: r });

  for (const p of items) {
    for (;;) {
      const node = heap.pop()!;
      if (counts[node.id] < rackPerPod) {
        counts[node.id]++;
        powers[node.id] += p;
        heap.push({ power: powers[node.id], count: counts[node.id], id: node.id });
        break;
      }
      // pod 已滿則捨棄（同 Python 行為）
    }
  }
  return { pods: R, maxPodPowerKw: Math.max(...powers) };
}

// ---------------- 非 IT 設備設計（式 16–19） ----------------
interface Candidate extends EquipmentDesignEntry {
  sortPowerEff: number;
  sortSpaceEff: number;
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}
function round2(x: number) {
  return Math.round(x * 100) / 100;
}
function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}

function categoryForRedundancy(slotCategory: EquipmentCategory, input: GenerateInput): string {
  const slot = REDUNDANCY_SLOTS.find((s) => s.categories.includes(slotCategory));
  return slot ? input.redundancy[slot.key] : "N+1";
}

/** 計算單一硬體於 IT 階段的設計（列級或中心級） */
function designHardwareIt(
  hw: EngineEquipment,
  redundancyStr: string,
  opts: { sm: number; dcKw: number; pods: number; maxPodPowerKw: number; isRowLevel: boolean },
): Candidate | null {
  const red = parseRedundancy(redundancyStr);
  if (!red) return null;
  const cap = hw.capacityKw;
  if (!cap || cap <= 0) return null;

  let total = 0;
  let unitsPerPod: number | undefined;
  let deliverable = cap;

  if (opts.isRowLevel) {
    if (red.type === "N+r") {
      unitsPerPod = Math.ceil(((1 + opts.sm) * opts.maxPodPowerKw) / cap) + red.r;
      deliverable = cap;
    } else {
      deliverable = (red.y * cap) / red.x;
      unitsPerPod = Math.ceil(((1 + opts.sm) * opts.maxPodPowerKw) / deliverable);
      unitsPerPod = red.x * Math.ceil(unitsPerPod / red.x);
    }
    total = unitsPerPod * opts.pods;
  } else {
    if (red.type === "N+r") {
      deliverable = cap;
      total = Math.ceil(((1 + opts.sm) * opts.dcKw) / cap) + red.r;
    } else {
      deliverable = (red.y * cap) / red.x;
      total = Math.ceil(((1 + opts.sm) * opts.dcKw) / deliverable);
      total = red.x * Math.ceil(total / red.x);
    }
  }

  let spaceM2: number | null = null;
  let spaceEff: number | null = null;
  if (hw.widthM != null && hw.depthM != null) {
    spaceM2 = round1(total * hw.depthM * hw.widthM * (1 + hw.accessAreaShare));
    spaceEff = spaceM2 > 0 ? round2(opts.dcKw / spaceM2) : null;
  }

  const isCooling = hw.peakPowerConsumptionKw != null;
  let maxPowerDemandMw: number | null = null;
  let powerEff: number | null = null;
  let maxConversionPowerMw: number | null = null;

  if (isCooling) {
    let demandKw = total * (hw.peakPowerConsumptionKw as number);
    if (red.type === "xN/y") demandKw = (demandKw * red.y) / red.x;
    powerEff = demandKw > 0 ? round2(opts.dcKw / demandKw) : null;
    maxPowerDemandMw = round3(demandKw / 1e3);
  } else if (hw.efficiency != null) {
    powerEff = hw.efficiency;
    maxConversionPowerMw = round3(((1 - hw.efficiency) * total * deliverable) / (1e3 * hw.efficiency));
  }

  return {
    equipmentId: hw.id,
    name: hw.name,
    vendor: hw.vendorName,
    totalCount: total,
    unitsPerPod,
    totalCapacityMw: round3((total * cap) / 1e3),
    spaceM2,
    spaceEfficiencyKwM2: spaceEff,
    maxPowerDemandMw,
    powerEfficiency: powerEff,
    maxConversionPowerMw,
    sortPowerEff: powerEff ?? -Infinity,
    sortSpaceEff: spaceEff ?? -Infinity,
  };
}

/** 廠務階段（UPS/MSB/Gen 支撐冷卻功耗，式 17b/19b） */
function designHardwareFacility(
  hw: EngineEquipment,
  redundancyStr: string,
  opts: { sm: number; coolingPowerMw: number },
): Candidate | null {
  const red = parseRedundancy(redundancyStr);
  if (!red) return null;
  const cap = hw.capacityKw;
  if (!cap || cap <= 0) return null;
  const loadKw = 1e3 * opts.coolingPowerMw;

  let total = 0;
  let deliverable = cap;
  if (red.type === "N+r") {
    deliverable = cap;
    total = Math.ceil(((1 + opts.sm) * loadKw) / cap) + red.r;
  } else {
    deliverable = (red.y * cap) / red.x;
    total = Math.ceil(((1 + opts.sm) * loadKw) / deliverable);
    total = red.x * Math.ceil(total / red.x);
  }

  let spaceM2: number | null = null;
  let spaceEff: number | null = null;
  if (hw.widthM != null && hw.depthM != null) {
    spaceM2 = round1(total * hw.depthM * hw.widthM * (1 + hw.accessAreaShare));
    spaceEff = spaceM2 > 0 ? round2(loadKw / spaceM2) : null;
  }

  let powerEff: number | null = null;
  let maxConversionPowerMw: number | null = null;
  let maxPowerDemandMw: number | null = null;
  if (hw.peakPowerConsumptionKw != null) {
    let demandKw = total * hw.peakPowerConsumptionKw;
    if (red.type === "xN/y") demandKw = (demandKw * red.y) / red.x;
    powerEff = demandKw > 0 ? round2(loadKw / demandKw) : null;
    maxPowerDemandMw = round3(demandKw / 1e3);
  } else if (hw.efficiency != null) {
    powerEff = hw.efficiency;
    maxConversionPowerMw = round3(((1 - hw.efficiency) * total * deliverable) / (1e3 * hw.efficiency));
  }

  return {
    equipmentId: hw.id,
    name: hw.name,
    vendor: hw.vendorName,
    totalCount: total,
    totalCapacityMw: round3((total * cap) / 1e3),
    spaceM2,
    spaceEfficiencyKwM2: spaceEff,
    maxPowerDemandMw,
    powerEfficiency: powerEff,
    maxConversionPowerMw,
    sortPowerEff: powerEff ?? -Infinity,
    sortSpaceEff: spaceEff ?? -Infinity,
  };
}

function pickBest(cands: Candidate[], criterion: OptimizationCriterion): Candidate | null {
  if (cands.length === 0) return null;
  const key = (c: Candidate): [number, number] =>
    criterion === "Space" ? [c.sortSpaceEff, c.sortPowerEff] : [c.sortPowerEff, c.sortSpaceEff];
  return cands.reduce((best, cur) => {
    const [a1, a2] = key(cur);
    const [b1, b2] = key(best);
    if (a1 !== b1) return a1 > b1 ? cur : best;
    return a2 > b2 ? cur : best;
  });
}

const FACILITY_CATEGORIES = new Set(["ups", "msb", "generator"]);

/** 單一 IT 結果 → 冷卻＋配電系統設計（所有優化目標） */
export function computeNonIt(
  it: ItResult,
  input: GenerateInput,
  equipment: EngineEquipment[],
  params: EngineParams,
): NonItResult[] {
  const dcKw = it.totalPeakPowerMw * 1e3;
  const sm = input.safetyMargin;
  const { pods, maxPodPowerKw } = arrangeRacksPerPod(it, input.rackPerRow, input.rowsPerPod);

  const heatCat: EquipmentCategory = input.heatRejectionMode === "Dry cooling" ? "dry_cooler" : "cooling_tower";
  const coolingCats: EquipmentCategory[] = [heatCat, "chiller", "cdu"];
  const powerItCats: EquipmentCategory[] = ["pdu", "ups", "msb", "generator"];

  const results: NonItResult[] = [];

  for (const criterion of input.optimizationCriteria) {
    // ---- IT 階段：冷卻 ----
    const coolingDesigns: Partial<Record<EquipmentCategory, EquipmentDesignEntry>> = {};
    for (const cat of coolingCats) {
      const cands = equipment
        .filter((e) => e.category === cat)
        .map((hw) =>
          designHardwareIt(hw, categoryForRedundancy(cat, input), {
            sm,
            dcKw,
            pods,
            maxPodPowerKw,
            isRowLevel: ROW_LEVEL_CATEGORIES.includes(cat),
          }),
        )
        .filter((x): x is Candidate => x != null);
      const best = pickBest(cands, criterion);
      if (best) coolingDesigns[cat] = best;
    }
    // 冷卻 Summary
    let coolingPowerMw = 0;
    let coolIn = 0;
    let coolOut = 0;
    for (const [cat, d] of Object.entries(coolingDesigns) as [EquipmentCategory, EquipmentDesignEntry][]) {
      coolingPowerMw += d.maxPowerDemandMw ?? 0;
      if (OUTDOOR_CATEGORIES.includes(cat)) coolOut += d.spaceM2 ?? 0;
      else coolIn += d.spaceM2 ?? 0;
    }
    coolingPowerMw = round3(coolingPowerMw);

    // ---- IT 階段：配電 ----
    const powerIt: Partial<Record<EquipmentCategory, EquipmentDesignEntry>> = {};
    for (const cat of powerItCats) {
      const cands = equipment
        .filter((e) => e.category === cat)
        .map((hw) =>
          designHardwareIt(hw, categoryForRedundancy(cat, input), {
            sm,
            dcKw,
            pods,
            maxPodPowerKw,
            isRowLevel: ROW_LEVEL_CATEGORIES.includes(cat),
          }),
        )
        .filter((x): x is Candidate => x != null);
      const best = pickBest(cands, criterion);
      if (best) powerIt[cat] = best;
    }

    // ---- 廠務階段（UPS/MSB/Gen 支撐冷卻功耗） ----
    const powerFacility: Partial<Record<EquipmentCategory, EquipmentDesignEntry>> = {};
    for (const cat of ["ups", "msb", "generator"] as EquipmentCategory[]) {
      if (!FACILITY_CATEGORIES.has(cat)) continue;
      const cands = equipment
        .filter((e) => e.category === cat)
        .map((hw) => designHardwareFacility(hw, categoryForRedundancy(cat, input), { sm, coolingPowerMw }))
        .filter((x): x is Candidate => x != null);
      const best = pickBest(cands, criterion);
      if (best) powerFacility[cat] = best;
    }

    // 配電 Summary（轉換損耗＋空間，IT＋廠務）
    let convPowerMw = 0;
    let powIn = 0;
    let powOut = 0;
    for (const group of [powerIt, powerFacility]) {
      for (const [cat, d] of Object.entries(group) as [EquipmentCategory, EquipmentDesignEntry][]) {
        convPowerMw += d.maxConversionPowerMw ?? 0;
        if (OUTDOOR_CATEGORIES.includes(cat)) powOut += d.spaceM2 ?? 0;
        else powIn += d.spaceM2 ?? 0;
      }
    }

    results.push({
      criterion,
      cooling: {
        designs: coolingDesigns,
        summary: { powerMw: coolingPowerMw, spaceIndoorM2: round1(coolIn), spaceOutdoorM2: round1(coolOut) },
      },
      power: {
        designsIt: powerIt,
        designsFacility: powerFacility,
        summary: { powerMw: round3(convPowerMw), spaceIndoorM2: round1(powIn), spaceOutdoorM2: round1(powOut) },
      },
    });
  }

  return results;
}

/** 完整管線：單一 IT 配置 → DatacenterResult */
export function computeDatacenter(
  config: EngineItConfig,
  input: GenerateInput,
  equipment: EngineEquipment[],
  params: EngineParams,
): DatacenterResult {
  const it = computeItResult(config, input, params);
  const nonIt = computeNonIt(it, input, equipment, params);
  const { pods, maxPodPowerKw } = arrangeRacksPerPod(it, input.rackPerRow, input.rowsPerPod);
  return {
    configName: config.name,
    it,
    nonIt,
    meta: { pods, maxPodPowerKw: round1(maxPodPowerKw), heatRejectionMode: input.heatRejectionMode },
  };
}

export const COOLING_SET = new Set<string>(COOLING_CATEGORIES as string[]);
