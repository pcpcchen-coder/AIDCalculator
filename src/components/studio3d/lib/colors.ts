/**
 * 3D 場景配色：依設備類別 / 機架節點型別 / 廠商決定外觀顏色。
 * 冷卻類（cdu/chiller/dry_cooler/cooling_tower）→ sky/cyan 系
 * 配電類（pdu/ups/msb/generator）→ violet/amber 系
 * 機架依 nodeType 分色；台達（Delta）設備一律使用品牌綠。
 */
import type { LayoutType } from "@contracts/layout";

const RACK_NODE_COLORS: Record<string, string> = {
  GPU: "#e879f9", // fuchsia
  "CPU-GPU": "#c084fc", // purple
  CPU: "#94a3b8", // slate
  Storage: "#64748b", // dark slate
};

const CATEGORY_COLORS: Record<string, string> = {
  cdu: "#22d3ee", // cyan
  chiller: "#38bdf8", // sky
  dry_cooler: "#7dd3fc", // light sky
  cooling_tower: "#67e8f9", // light cyan
  pdu: "#a78bfa", // violet
  ups: "#8b5cf6", // deep violet
  msb: "#c4b5fd", // light violet
  generator: "#f59e0b", // amber
};

export const DELTA_GREEN = "#34d399";
export const RACK_DEFAULT = "#a1a1aa";
export const HOVER_HIGHLIGHT = "#fef08a";

export function isDeltaVendor(vendor: string | null | undefined): boolean {
  return !!vendor && vendor.toLowerCase().includes("delta");
}

/** 型別 → 主色（hex） */
export function colorForType(t: LayoutType): string {
  if (isDeltaVendor(t.vendor)) return DELTA_GREEN;
  if (t.category === "rack") {
    return (t.nodeType && RACK_NODE_COLORS[t.nodeType]) || RACK_DEFAULT;
  }
  return CATEGORY_COLORS[t.category] ?? "#38bdf8";
}

/** zone 平台地板色 */
export const ZONE_TINT: Record<string, string> = {
  white: "#1b2536",
  indoor: "#1e2b45",
  outdoor: "#161d29",
};

export const ZONE_LINE: Record<string, string> = {
  white: "#38bdf8",
  indoor: "#818cf8",
  outdoor: "#475569",
};
