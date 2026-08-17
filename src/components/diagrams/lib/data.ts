/**
 * 配置圖共用資料配接：由 LayoutModel + GenerateResult 取出當前配置的
 * DatacenterResult / NonItResult，以及各類查表輔助。
 */
import type {
  DatacenterResult,
  EquipmentCategory,
  GenerateResult,
  NonItResult,
} from "@contracts/dcgen";
import type { LayoutModel, LayoutType } from "@contracts/layout";

/** 依 model.source 找回對應的 dc / nonIt（找不到時退回第一筆） */
export function pickResult(
  result: GenerateResult,
  model: LayoutModel,
): { dc: DatacenterResult; nonIt: NonItResult } | null {
  const dc =
    result.results.find((r) => r.configName === model.source.configName) ??
    result.results[0];
  if (!dc) return null;
  const nonIt =
    dc.nonIt.find((n) => n.criterion === model.source.criterion) ?? dc.nonIt[0];
  if (!nonIt) return null;
  return { dc, nonIt };
}

/** typeKey 索引 */
export function typeMapOf(model: LayoutModel): Map<string, LayoutType> {
  return new Map(model.types.map((t) => [t.key, t]));
}

/** 設備類別 → i18n key（沿用 generator 組既有字典） */
export function categoryLabelKey(cat: EquipmentCategory | "rack"): string {
  return cat === "rack" ? "diagrams.common.category.rack" : `generator.category.${cat}`;
}

/** 設備類別中文短名不需要；直接由 t() 取 generator.category.* */
export const MONO_NUM = "font-mono tabular-nums";
