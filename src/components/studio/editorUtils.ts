/**
 * 擺放編輯器共用工具：顏色、對齊、預設聚合塊打包。
 */
import type { LayoutModel, LayoutType, PlacedOverride, Zone } from '@contracts/layout';

/** 縮放級距（px/m） */
export const ZOOM_OPTIONS = [12, 24, 48] as const;

/** 0.1m 對齊 */
export const snap = (v: number): number => Math.round(v * 10) / 10;

export const MIN_BLOCK = 0.2; // 最小寬/深（m）

/** 類別主色（design token：rack=cyan、冷卻=sky 系、配電=violet/amber 系） */
export const CATEGORY_COLORS: Record<string, string> = {
  rack: '#22D3EE', // accent cyan
  cdu: '#38BDF8', // cool sky
  chiller: '#0EA5E9',
  dry_cooler: '#7DD3FC',
  cooling_tower: '#0284C7',
  pdu: '#A78BFA', // violet
  ups: '#F59E0B', // power amber
  msb: '#8B5CF6',
  generator: '#D97706',
};

export const colorOf = (type: LayoutType): string => CATEGORY_COLORS[type.category] ?? '#94A3B8';

/** 台達廠商判定（vendor 含 Delta，不分大小寫） */
export const isDeltaVendor = (vendor: string | null | undefined): boolean =>
  !!vendor && /delta/i.test(vendor);

/** 公尺數格式化（一位小數、去尾零） */
export const fmtM = (v: number): string => String(Math.round(v * 10) / 10);

export const fmtInt = (v: number): string =>
  v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);

/**
 * 聚合模式預設版面：每型別一個「摘要塊」，尺寸約等於台數排成近方陣的足跡，
 * 再以貨架式（shelf）流程在 zone 內由左上往右下打包，彼此不重疊。
 */
export function defaultTypeRects(model: LayoutModel): Record<string, PlacedOverride> {
  const rects: Record<string, PlacedOverride> = {};
  const GAP = 0.3;
  const SHELF_GAP = 0.6;
  const MARGIN = 0.8;
  const zones: Zone[] = ['white', 'indoor', 'outdoor'];
  for (const zone of zones) {
    const room = model.rooms[zone];
    let x = MARGIN;
    let y = MARGIN;
    let shelfH = 0;
    const zoneTypes = model.types.filter((t) => t.zone === zone);
    for (const t of zoneTypes) {
      const count = Math.max(1, t.count);
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const w = snap(Math.max(MIN_BLOCK, cols * t.w + (cols - 1) * 0.15));
      const d = snap(Math.max(MIN_BLOCK, rows * t.d + (rows - 1) * 0.15));
      if (x + w > room.w - MARGIN + 0.001 && x > MARGIN) {
        x = MARGIN;
        y += shelfH + SHELF_GAP;
        shelfH = 0;
      }
      rects[t.key] = { x: snap(x), y: snap(y), w, d };
      x += w + GAP;
      shelfH = Math.max(shelfH, d);
    }
  }
  return rects;
}

/** 實例覆寫鍵：typeKey#index */
export const instanceKey = (typeKey: string, index: number): string => `${typeKey}#${index}`;

/** 數值限制於 [min, max] */
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));
