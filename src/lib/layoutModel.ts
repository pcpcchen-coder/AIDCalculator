/**
 * autoLayout：GenerateResult → LayoutModel（決定性自動版面）
 * 供平面圖 / 3D / 電路圖 / 冷卻圖 / 擺放編輯器共用的資料配接器。
 */
import type {
  DatacenterResult,
  EquipmentCategory,
  GenerateResult,
} from "../../contracts/dcgen";
import { REDUNDANCY_SLOTS } from "../../contracts/dcgen";
import type {
  LayoutInstance,
  LayoutModel,
  LayoutType,
  RoomRect,
  Zone,
} from "../../contracts/layout";

export interface EquipmentDims {
  id: number;
  category: string;
  widthM: number | null;
  depthM: number | null;
  heightM: number | null;
}

const RACK_W = 0.6;
const RACK_D = 1.2;
const RACK_H = 2.0;
const GAP = 0.25;
const POD_GAP = 1.4;

function dimsOf(e: { widthM?: number | null; depthM?: number | null; heightM?: number | null }) {
  return {
    w: e.widthM ?? 0.8,
    d: e.depthM ?? 1.0,
    h: e.heightM ?? 2.0,
  };
}

function redundancyFor(category: EquipmentCategory, redundancy: GenerateResult["input"]["redundancy"]): string {
  const slot = REDUNDANCY_SLOTS.find((s) => s.categories.includes(category));
  return slot ? redundancy[slot.key] : "N+1";
}

export function buildLayoutModel(
  result: GenerateResult,
  configIdx: number,
  criterion: "Space" | "Power",
  catalog: EquipmentDims[],
): LayoutModel | null {
  const dc: DatacenterResult | undefined = result.results[configIdx];
  if (!dc) return null;
  const nonIt = dc.nonIt.find((n) => n.criterion === criterion);
  if (!nonIt) return null;
  const input = result.input;
  const catById = new Map(catalog.map((c) => [c.id, c]));

  const types: LayoutType[] = [];
  const instances: Record<Zone, LayoutInstance[]> = { white: [], indoor: [], outdoor: [] };

  // ---------- White：IT 機架 ----------
  const nodeTypes = Object.keys(dc.it.rackCount);
  const pitchX = RACK_W + 0.3; // 0.9m
  const pitchY = Math.max(RACK_D + 0.6, input.rackPerRow > 0 ? dc.it.spaceM2 / dc.it.totalRacks / pitchX : 2);
  let yCursor = 1.0;
  let maxX = 1.0;
  const pods = Math.max(1, dc.meta.pods || Math.ceil(dc.it.totalRacks / (input.rackPerRow * input.rowsPerPod)));

  // 依 pod 逐列放置（每 pod = rowsPerPod 列、每列 rackPerRow 架）
  let remaining: Record<string, number> = { ...dc.it.rackCount };
  const nodeQueue = nodeTypes.filter((t) => remaining[t] > 0);
  let currentNode = 0;
  for (let pod = 0; pod < pods; pod++) {
    for (let row = 0; row < input.rowsPerPod; row++) {
      let x = 1.0;
      for (let col = 0; col < input.rackPerRow; col++) {
        const nt = nodeQueue[currentNode];
        if (!nt) break;
        if (remaining[nt] <= 0) {
          currentNode++;
          continue;
        }
        const key = `rack:${nt}`;
        instances.white.push({ typeKey: key, x, y: yCursor });
        remaining[nt]--;
        x += pitchX;
        maxX = Math.max(maxX, x);
      }
      yCursor += pitchY;
    }
    yCursor += POD_GAP;
  }
  const rackGridW = maxX;
  const cduLane = 2.2;
  const pduLane = 1.6;
  const whiteW = Math.max(8, rackGridW + cduLane + pduLane);
  const whiteD = yCursor + 1.0;

  for (const nt of nodeTypes) {
    if (dc.it.rackCount[nt] > 0) {
      types.push({
        key: `rack:${nt}`,
        category: "rack",
        name: `IT 機架（${nt}）`,
        vendor: null,
        equipmentId: null,
        count: dc.it.rackCount[nt],
        zone: "white",
        w: RACK_W,
        d: RACK_D,
        h: RACK_H,
        nodeType: nt,
        rackTdp: dc.it.peakPowerMw[nt] / dc.it.rackCount[nt] / 1 || undefined,
        capacityKw: dc.it.peakPowerMw[nt] * 1000,
      });
    }
  }

  // ---------- 設備類（冷卻＋配電） ----------
  interface BomSource {
    category: EquipmentCategory;
    entry: {
      equipmentId: number;
      name: string;
      vendor: string | null;
      totalCount: number;
      unitsPerPod?: number;
      totalCapacityMw: number;
      maxPowerDemandMw?: number | null;
      maxConversionPowerMw?: number | null;
    };
    stage?: "IT" | "Facility";
  }
  const bom: BomSource[] = [];
  for (const [cat, entry] of Object.entries(nonIt.cooling.designs) as [EquipmentCategory, BomSource["entry"]][]) {
    if (entry) bom.push({ category: cat, entry });
  }
  for (const [cat, entry] of Object.entries(nonIt.power.designsIt) as [EquipmentCategory, BomSource["entry"]][]) {
    if (entry) bom.push({ category: cat, entry, stage: "IT" });
  }
  for (const [cat, entry] of Object.entries(nonIt.power.designsFacility) as [EquipmentCategory, BomSource["entry"]][]) {
    if (entry) bom.push({ category: cat, entry, stage: "Facility" });
  }

  const zoneOf = (cat: EquipmentCategory): Zone => {
    if (cat === "cdu" || cat === "pdu") return "white";
    if (cat === "dry_cooler" || cat === "cooling_tower" || cat === "generator") return "outdoor";
    return "indoor";
  };

  for (const { category, entry, stage } of bom) {
    const dims = dimsOf(catById.get(entry.equipmentId) ?? {});
    const key = `${category}:${entry.equipmentId}:${stage ?? "IT"}`;
    const zone = zoneOf(category);
    types.push({
      key,
      category,
      name: entry.name,
      vendor: entry.vendor,
      equipmentId: entry.equipmentId,
      count: entry.totalCount,
      unitsPerPod: entry.unitsPerPod,
      zone,
      ...dims,
      capacityKw: entry.totalCapacityMw * 1000,
      powerMw: entry.maxPowerDemandMw ?? entry.maxConversionPowerMw ?? undefined,
      redundancy: redundancyFor(category, input.redundancy),
      stage,
    });

    // ---------- 實例配置 ----------
    if (zone === "white" && category === "cdu") {
      // 每 pod 右側 lane
      const upp = entry.unitsPerPod ?? Math.ceil(entry.totalCount / pods);
      let y = 1.0;
      let placed = 0;
      for (let pod = 0; pod < pods && placed < entry.totalCount; pod++) {
        for (let i = 0; i < upp && placed < entry.totalCount; i++) {
          instances.white.push({ typeKey: key, x: rackGridW + pduLane + 0.4, y: y + i * (dims.d + GAP) });
          placed++;
        }
        y += input.rowsPerPod * pitchY + POD_GAP;
      }
    } else if (zone === "white" && category === "pdu") {
      const upp = entry.unitsPerPod ?? Math.ceil(entry.totalCount / pods);
      let y = 1.0;
      let placed = 0;
      for (let pod = 0; pod < pods && placed < entry.totalCount; pod++) {
        for (let i = 0; i < upp && placed < entry.totalCount; i++) {
          instances.white.push({ typeKey: key, x: 0.2, y: y + i * (dims.d + GAP) });
          placed++;
        }
        y += input.rowsPerPod * pitchY + POD_GAP;
      }
    }
  }

  // ---------- Indoor：chiller / UPS / MSB 依序分區 ----------
  const grayIndoorM2 =
    nonIt.cooling.summary.spaceIndoorM2 + nonIt.power.summary.spaceIndoorM2;
  const indoorD = Math.max(4, grayIndoorM2 / whiteW);
  const indoorTypes = types.filter((t) => t.zone === "indoor");
  let xCursor = 1.0;
  for (const t of indoorTypes) {
    const perCol = Math.max(1, Math.floor((indoorD - 1.5) / (t.d + GAP)));
    let placed = 0;
    let col = 0;
    while (placed < t.count) {
      for (let r = 0; r < perCol && placed < t.count; r++) {
        instances.indoor.push({ typeKey: t.key, x: xCursor + col * (t.w + GAP), y: 0.8 + r * (t.d + GAP) });
        placed++;
      }
      col++;
    }
    xCursor += Math.max(1, col) * (t.w + GAP) + 1.2;
  }

  // ---------- Outdoor：散熱端網格＋發電機列 ----------
  const grayOutdoorM2 =
    nonIt.cooling.summary.spaceOutdoorM2 + nonIt.power.summary.spaceOutdoorM2;
  const outdoorD = Math.max(4, grayOutdoorM2 / whiteW);
  const heat = types.filter((t) => t.zone === "outdoor" && (t.category === "dry_cooler" || t.category === "cooling_tower"));
  const gens = types.filter((t) => t.category === "generator");
  let heatY = 0.8;
  for (const t of heat) {
    const perRow = Math.max(1, Math.floor((whiteW - 2) / (t.w + GAP)));
    for (let i = 0; i < t.count; i++) {
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      instances.outdoor.push({ typeKey: t.key, x: 1.0 + c * (t.w + GAP), y: 0.8 + r * (t.d + GAP) });
    }
    const rows = Math.ceil(t.count / perRow);
    heatY = 0.8 + rows * (t.d + GAP);
  }
  let gy = heatY + 1.0;
  for (const t of gens) {
    const perRow = Math.max(1, Math.floor((whiteW - 2) / (t.w + GAP)));
    for (let i = 0; i < t.count; i++) {
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      instances.outdoor.push({ typeKey: t.key, x: 1.0 + c * (t.w + GAP), y: gy + r * (t.d + GAP) });
    }
    gy += Math.ceil(t.count / perRow) * (t.d + GAP) + 1.0;
  }

  const rooms: Record<Zone, RoomRect> = {
    white: { w: whiteW, d: whiteD, areaM2: dc.it.spaceM2 },
    indoor: { w: whiteW, d: indoorD, areaM2: grayIndoorM2 },
    outdoor: { w: whiteW, d: outdoorD, areaM2: grayOutdoorM2 },
  };

  return {
    source: {
      configName: dc.configName,
      criterion,
      generation: dc.it.generation,
    },
    params: {
      rackPerRow: input.rackPerRow,
      rowsPerPod: input.rowsPerPod,
      pods,
      totalRacks: dc.it.totalRacks,
      floorSpaceM2: input ? dc.it.spaceM2 / dc.it.totalRacks : 1.8,
    },
    rooms,
    types,
    instances,
    metrics: {
      itPowerMw: dc.it.totalPeakPowerMw,
      powerDensityKwM2: dc.it.powerDensityKwM2,
      whiteSpaceM2: dc.it.spaceM2,
      grayIndoorM2,
      grayOutdoorM2,
      coolingPowerMw: nonIt.cooling.summary.powerMw,
      conversionLossMw: nonIt.power.summary.powerMw,
    },
  };
}

/** 展開實例上限（擺放編輯器「展開實例」模式） */
export const INSTANCE_RENDER_CAP = 400;
