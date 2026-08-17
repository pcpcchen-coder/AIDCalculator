/**
 * 配置圖共用主題：設計 token 色票（SVG 屬性需用實際色值）、
 * 類別/節點配色與數值格式化工具。
 */
import type { EquipmentCategory } from "@contracts/dcgen";
import type { LayoutType } from "@contracts/layout";

/** 與 tailwind.config 設計 token 對齊 */
export const C = {
  bg0: "#070B14",
  bg1: "#0B1220",
  bg2: "#101A2E",
  bg3: "#16233C",
  line: "#1E2D4A",
  accent: "#22D3EE",
  power: "#F59E0B",
  cool: "#38BDF8",
  green: "#34D399",
  violet: "#A78BFA",
  red: "#F87171",
  text0: "#F1F5F9",
  text1: "#94A3B8",
  text2: "#64748B",
} as const;

export const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** 設備類別主色（冷卻系統偏 cool/accent，配電系統偏 violet/amber） */
export const CATEGORY_COLOR: Record<EquipmentCategory | "rack", string> = {
  cdu: C.cool,
  chiller: C.accent,
  dry_cooler: "#2DD4BF",
  cooling_tower: C.green,
  pdu: C.violet,
  ups: C.power,
  msb: "#FBBF24",
  generator: C.red,
  rack: C.accent,
};

/** IT 機架依節點型別著色 */
export const NODE_TYPE_COLOR: Record<string, string> = {
  GPU: C.accent,
  "CPU-GPU": C.violet,
  CPU: C.green,
  Storage: C.text2,
};

/** 單一 LayoutType 的顯示色 */
export function typeColor(t: LayoutType): string {
  if (t.category === "rack") {
    return NODE_TYPE_COLOR[t.nodeType ?? ""] ?? C.accent;
  }
  return CATEGORY_COLOR[t.category] ?? C.text1;
}

/** 台達（Delta）設備 → 綠框 */
export function isDeltaVendor(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  const v = vendor.toLowerCase();
  return v.includes("台達") || v.includes("delta");
}

export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtMw(n: number): string {
  return n >= 100 ? fmt(n, 0) : n >= 10 ? fmt(n, 1) : fmt(n, 2);
}

export function fmtKw(n: number): string {
  return n >= 1000 ? fmt(n, 0) : n >= 100 ? fmt(n, 1) : fmt(n, 2);
}
