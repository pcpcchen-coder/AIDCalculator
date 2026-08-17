/**
 * 配置圖工作室（Layout Studio）共用型別
 * 由 GenerateResult 推導出的「可視化版面模型」，供 2D 平面圖、3D 展示、
 * 電路單線圖、冷卻架構圖與擺放編輯器共用。
 */
import type { EquipmentCategory } from "./dcgen";

/** 擺放區域：White（IT 機房）/ Indoor（室內機電房）/ Outdoor（室外場） */
export type Zone = "white" | "indoor" | "outdoor";

export const ZONE_ORDER: Zone[] = ["white", "indoor", "outdoor"];

/** 單一設備型別（聚合視圖） */
export interface LayoutType {
  key: string; // `${category}:${equipmentId}` 或 rack 專用 key
  category: EquipmentCategory | "rack";
  name: string;
  vendor: string | null;
  equipmentId: number | null;
  count: number; // BOM 台數（或機架數）
  unitsPerPod?: number; // 列級設備
  zone: Zone;
  /** 實體尺寸（公尺）；無資料時給預設 */
  w: number;
  d: number;
  h: number;
  capacityKw?: number;
  /** 冷卻類功耗（MW）或配電類轉換損耗（MW） */
  powerMw?: number;
  redundancy?: string;
  stage?: "IT" | "Facility"; // 配電設備階段
  /** 機架專用：節點型別 */
  nodeType?: string;
  rackTdp?: number;
}

/** 單一實例的座標（公尺，zone 內局部座標） */
export interface LayoutInstance {
  typeKey: string;
  x: number;
  y: number;
}

export interface RoomRect {
  w: number; // 公尺
  d: number; // 公尺
  areaM2: number;
}

export interface LayoutModel {
  source: {
    designId?: number;
    configName: string;
    criterion: "Space" | "Power";
    generation: string;
  };
  params: {
    rackPerRow: number;
    rowsPerPod: number;
    pods: number;
    totalRacks: number;
    floorSpaceM2: number; // m²/rack
  };
  rooms: Record<Zone, RoomRect>;
  types: LayoutType[];
  instances: Record<Zone, LayoutInstance[]>;
  metrics: {
    itPowerMw: number;
    powerDensityKwM2: number;
    whiteSpaceM2: number;
    grayIndoorM2: number;
    grayOutdoorM2: number;
    coolingPowerMw: number;
    conversionLossMw: number;
  };
}

/** 擺放編輯器的使用者覆寫（位置/尺寸/隱藏群組） */
export interface PlacedOverride {
  x: number;
  y: number;
  w: number;
  d: number;
}

export interface LayoutDoc {
  version: 1;
  /** typeKey → 覆寫（編輯器以 type 聚合塊為操作單位） */
  overrides: Record<string, PlacedOverride>;
  /** 展開實例時的個別覆寫：instanceKey(typeKey#i) → 位置 */
  instanceOverrides?: Record<string, { x: number; y: number }>;
  zoom?: number;
}

export interface SavedLayoutRow {
  id: number;
  name: string;
  designId: number | null;
  configName: string;
  criterion: string;
  layout: string; // LayoutDoc JSON
  createdAt: string | Date;
  updatedAt: string | Date;
}
