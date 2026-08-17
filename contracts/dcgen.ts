/**
 * DCGen Web 共用型別與常數（前端與後端共用）
 * 對應 arXiv:2604.09616（DCGen 1.1）之模型定義
 */

// ---------------- 資料中心類型 ----------------
export const DATACENTER_TYPES = [
  "AI training",
  "AI inference",
  "Mixed AI training and inference",
  "Cloud",
] as const;
export type DatacenterType = (typeof DATACENTER_TYPES)[number];

export const DATACENTER_TYPE_LABELS: Record<DatacenterType, string> = {
  "AI training": "AI 訓練",
  "AI inference": "AI 推論",
  "Mixed AI training and inference": "混合 AI 訓練與推論",
  Cloud: "雲端",
};

export const NODE_TYPES = ["GPU", "CPU-GPU", "CPU", "Storage"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<string, string> = {
  GPU: "GPU 機架",
  "CPU-GPU": "CPU-GPU 機架",
  CPU: "CPU 機架",
  Storage: "儲存機架",
};

// ---------------- 設備分類 ----------------
export const EQUIPMENT_CATEGORIES = [
  "cdu",
  "chiller",
  "dry_cooler",
  "cooling_tower",
  "pdu",
  "ups",
  "msb",
  "generator",
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  cdu: "CDU 液冷分配單元",
  chiller: "冰水機",
  dry_cooler: "乾冷卻器",
  cooling_tower: "冷卻水塔",
  pdu: "PDU 配電單元",
  ups: "UPS 不斷電系統",
  msb: "MSB 主配電盤",
  generator: "備援發電機",
};

/** DCGen 系統分群（對應論文 Figure 3） */
export const SYSTEM_GROUPS = {
  cooling: ["cdu", "chiller", "dry_cooler", "cooling_tower"] as EquipmentCategory[],
  power: ["pdu", "ups", "msb", "generator"] as EquipmentCategory[],
};

/** 設計層級：row-level（pod）vs datacenter-level */
export const ROW_LEVEL_CATEGORIES: EquipmentCategory[] = ["cdu", "pdu"];
export const DC_LEVEL_CATEGORIES: EquipmentCategory[] = [
  "chiller",
  "dry_cooler",
  "cooling_tower",
  "ups",
  "msb",
  "generator",
];

/** 室內/室外（gray space 分攤） */
export const OUTDOOR_CATEGORIES: EquipmentCategory[] = ["dry_cooler", "cooling_tower", "generator"];

/** 冷卻類設備（有 PeakPowerConsumption）；配電類設備（有 Efficiency） */
export const COOLING_CATEGORIES: EquipmentCategory[] = ["cdu", "chiller", "dry_cooler", "cooling_tower"];

/** 冗餘設定的 UI 鍵名 → 類別 */
export const REDUNDANCY_SLOTS = [
  { key: "heatRejection", label: "散熱端（乾冷卻器/冷卻水塔）", categories: ["dry_cooler", "cooling_tower"] as EquipmentCategory[] },
  { key: "chillers", label: "冰水機", categories: ["chiller"] as EquipmentCategory[] },
  { key: "cdus", label: "CDU", categories: ["cdu"] as EquipmentCategory[] },
  { key: "pdus", label: "PDU", categories: ["pdu"] as EquipmentCategory[] },
  { key: "upss", label: "UPS", categories: ["ups"] as EquipmentCategory[] },
  { key: "msbs", label: "MSB", categories: ["msb"] as EquipmentCategory[] },
  { key: "generators", label: "備援發電機", categories: ["generator"] as EquipmentCategory[] },
] as const;
export type RedundancySlotKey = (typeof REDUNDANCY_SLOTS)[number]["key"];
export type RedundancyMap = Record<RedundancySlotKey, string>;

export const DEFAULT_REDUNDANCY: RedundancyMap = {
  heatRejection: "N+1",
  chillers: "N+1",
  cdus: "N+1",
  pdus: "N+1",
  upss: "2N",
  msbs: "2N",
  generators: "2N",
};

// ---------------- 產生器輸入/輸出 ----------------
export const HEAT_REJECTION_MODES = ["Dry cooling", "Evaporative cooling"] as const;
export type HeatRejectionMode = (typeof HEAT_REJECTION_MODES)[number];
export const HEAT_REJECTION_LABELS: Record<HeatRejectionMode, string> = {
  "Dry cooling": "乾式冷卻（Dry cooler）",
  "Evaporative cooling": "蒸發冷卻（冷卻水塔）",
};

export const OPTIMIZATION_CRITERIA = ["Space", "Power"] as const;
export type OptimizationCriterion = (typeof OPTIMIZATION_CRITERIA)[number];

export const GENERATION_YEARS = ["2024", "2027", "2029"] as const;

export interface GenerateInput {
  datacenterUseCase: DatacenterType;
  datacenterScale:
    | { target: "rack_count"; capacity: number }
    | { target: "power_capacity"; capacity: string };
  model: "Canonical" | "Reference";
  generation: string; // "2024" | "2027" | "2029" | "All"（Reference 模式忽略）
  specificDatacenters: string[] | "All";
  heatRejectionMode: HeatRejectionMode;
  optimizationCriteria: OptimizationCriterion[];
  rackPerRow: number;
  rowsPerPod: number;
  safetyMargin: number;
  redundancy: RedundancyMap;
}

/** 單一 IT 配置的運算結果 */
export interface ItResult {
  configName: string;
  generation: string;
  rackCount: Record<string, number>;
  peakPowerMw: Record<string, number>;
  totalPeakPowerMw: number;
  totalRacks: number;
  powerDensityKwM2: number;
  spaceM2: number;
}

/** 設備選型結果（單一硬體、單一優化目標） */
export interface EquipmentDesignEntry {
  equipmentId: number;
  name: string;
  vendor: string | null;
  totalCount: number;
  unitsPerPod?: number;
  totalCapacityMw: number;
  spaceM2: number | null;
  spaceEfficiencyKwM2: number | null;
  maxPowerDemandMw?: number | null; // 冷卻類
  powerEfficiency?: number | null;
  maxConversionPowerMw?: number | null; // 配電類
}

export interface SystemSummary {
  powerMw: number;
  spaceIndoorM2: number;
  spaceOutdoorM2: number;
}

export interface NonItResult {
  criterion: OptimizationCriterion;
  cooling: {
    designs: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
    summary: SystemSummary;
  };
  power: {
    designsIt: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
    designsFacility: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
    summary: SystemSummary;
  };
}

export interface DatacenterResult {
  configName: string;
  it: ItResult;
  nonIt: NonItResult[];
  meta: {
    pods: number;
    maxPodPowerKw: number;
    heatRejectionMode: HeatRejectionMode;
  };
}

export interface GenerateResult {
  input: GenerateInput;
  parameterSnapshot: Record<string, number>;
  results: DatacenterResult[];
  createdAt: string;
}

// ---------------- 算法試算 ----------------
export interface AlgorithmTestInput {
  formula: string;
  variables: Record<string, number>;
}
