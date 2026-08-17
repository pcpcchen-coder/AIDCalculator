/**
 * 2D 平面配置圖（FloorPlan）
 * 依 LayoutModel 三區（white / indoor / outdoor）以公尺制 viewBox 繪製縮放 SVG：
 * - White：IT 機架格（依 nodeType 著色）＋ pod 分隔線＋ CDU/PDU 實例
 * - Indoor：chiller / UPS / MSB（過多以格網省略並標 ×N）
 * - Outdoor：散熱端（乾冷卻器/冷卻水塔）＋發電機
 * 每區標名稱＋W×D m＋面積 m²；下方比例尺、型別圖例與元件清單（BOM 表，以 model.types 為準）。
 * hover 任一實例顯示 tooltip（型號/廠商/容量）。
 */
import { useMemo } from "react";
import type { LayoutInstance, LayoutModel, LayoutType, Zone } from "@contracts/layout";
import { ZONE_ORDER } from "@contracts/layout";
import { tpl, useI18n } from "@/i18n";
import {
  DiagramFrame,
  Legend,
  MetricChip,
} from "@/components/diagrams/lib/common";
import { useSvgTooltip, type TipLine } from "@/components/diagrams/lib/useSvgTooltip";
import {
  C,
  MONO,
  fmt,
  fmtKw,
  fmtMw,
  isDeltaVendor,
  typeColor,
} from "@/components/diagrams/lib/theme";
import { categoryLabelKey, typeMapOf } from "@/components/diagrams/lib/data";

const M = 3; // 外邊界（m）
const LABEL_BAND = 2.0; // 每區上方標題帶
const ZONE_GAP = 2.5; // 區間距
const SCALE_H = 6; // 比例尺保留高度

/** 每型別最多直接畫出的實例數（超過以 ×N 省略） */
const DRAW_CAP: Record<Zone, number> = { white: 400, indoor: 24, outdoor: 36 };

interface DrawItem {
  inst: LayoutInstance;
  type: LayoutType;
  omitted?: number; // 省略代表的數量（×N 格）
}

export default function FloorPlan({ model }: { model: LayoutModel }) {
  const { t } = useI18n();
  const { hostRef, show, hide, overlay } = useSvgTooltip();

  const typeByKey = useMemo(() => typeMapOf(model), [model]);

  // ---------- 幾何 ----------
  const geo = useMemo(() => {
    const roomW = Math.max(model.rooms.white.w, model.rooms.indoor.w, model.rooms.outdoor.w);
    const zoneY: Record<Zone, number> = {
      white: M + LABEL_BAND,
      indoor: M + LABEL_BAND + model.rooms.white.d + ZONE_GAP + LABEL_BAND,
      outdoor:
        M + LABEL_BAND + model.rooms.white.d + ZONE_GAP + LABEL_BAND +
        model.rooms.indoor.d + ZONE_GAP + LABEL_BAND,
    };
    const W = roomW + M * 2;
    const H = zoneY.outdoor + model.rooms.outdoor.d + M + SCALE_H;
    // 比例尺刻度：選 1/2/5/10/20/50 使段數落在 4–8
    const steps = [1, 2, 5, 10, 20, 50];
    const step = steps.find((s) => roomW / s >= 4 && roomW / s <= 8) ?? 10;
    return { roomW, zoneY, W, H, step };
  }, [model]);

  // ---------- 每區待畫實例（含省略 ×N 格） ----------
  const drawItems = useMemo(() => {
    const out: Record<Zone, DrawItem[]> = { white: [], indoor: [], outdoor: [] };
    for (const zone of ZONE_ORDER) {
      const byType = new Map<string, LayoutInstance[]>();
      for (const inst of model.instances[zone]) {
        const arr = byType.get(inst.typeKey) ?? [];
        arr.push(inst);
        byType.set(inst.typeKey, arr);
      }
      for (const [key, arr] of byType) {
        const type = typeByKey.get(key);
        if (!type) continue;
        const cap = type.category === "rack" ? DRAW_CAP.white : DRAW_CAP[zone];
        const shown = arr.slice(0, cap);
        for (const inst of shown) out[zone].push({ inst, type });
        if (arr.length > cap) {
          // 以最後一格位置畫虛線省略格，標 ×N
          const anchor = arr[cap - 1];
          out[zone].push({ inst: anchor, type, omitted: arr.length - cap });
        }
      }
    }
    return out;
  }, [model, typeByKey]);

  // ---------- Pod 分隔線（white 區） ----------
  const podLines = useMemo(() => {
    const rowsSet = new Set<number>();
    for (const d of drawItems.white) {
      if (d.type.category === "rack" && !d.omitted) rowsSet.add(Number(d.inst.y.toFixed(2)));
    }
    const rows = [...rowsSet].sort((a, b) => a - b);
    const rpp = Math.max(1, model.params.rowsPerPod);
    const lines: { y: number; pod: number }[] = [];
    for (let p = 1; p < model.params.pods; p++) {
      const a = rows[p * rpp - 1];
      const b = rows[p * rpp];
      if (a == null || b == null) continue;
      lines.push({ y: (a + b) / 2, pod: p });
    }
    return { lines, rows, rpp };
  }, [drawItems, model.params.pods, model.params.rowsPerPod]);

  // ---------- tooltip ----------
  const tipFor = (type: LayoutType): { title: string; sub?: string; lines: TipLine[] } => {
    const lines: TipLine[] = [
      { k: t("diagrams.common.type"), v: t(categoryLabelKey(type.category)) },
      { k: t("diagrams.common.vendor"), v: type.vendor ?? t("diagrams.common.na") },
      {
        k: t("diagrams.common.count"),
        v: `${fmt(type.count)} ${type.category === "rack" ? t("diagrams.floor.rackUnit") : t("diagrams.common.units")}`,
      },
    ];
    if (type.capacityKw != null && type.count > 0) {
      lines.push({
        k: t("diagrams.common.unitCapacity"),
        v: `${fmtKw(type.capacityKw / type.count)} kW`,
      });
      lines.push({
        k: t("diagrams.common.totalCapacity"),
        v: `${fmtKw(type.capacityKw)} kW`,
      });
    }
    if (type.category === "rack" && type.rackTdp != null) {
      lines.push({ k: t("diagrams.floor.rackTdp"), v: `${fmtKw(type.rackTdp * 1000)} kW` });
    }
    if (type.powerMw != null) {
      lines.push({ k: t("diagrams.common.powerLoss"), v: `${fmtMw(type.powerMw)} MW` });
    }
    if (type.redundancy) {
      lines.push({ k: t("diagrams.common.redundancy"), v: type.redundancy });
    }
    return { title: type.name, sub: type.nodeType ?? undefined, lines };
  };

  const renderItem = (d: DrawItem, zone: Zone, i: number) => {
    const { inst, type } = d;
    const x = M + inst.x;
    const y = geo.zoneY[zone] + inst.y;
    const color = typeColor(type);
    const delta = isDeltaVendor(type.vendor);
    if (d.omitted != null) {
      return (
        <g key={`${inst.typeKey}-om-${i}`}>
          <rect
            x={x}
            y={y}
            width={type.w}
            height={type.d}
            rx={0.08}
            fill="none"
            stroke={color}
            strokeWidth={0.06}
            strokeDasharray="0.18 0.12"
            opacity={0.9}
          />
          <text
            x={x + type.w / 2}
            y={y + type.d / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.min(type.w, type.d) * 0.5}
            fill={color}
            fontFamily={MONO}
          >
            ×{d.omitted}
          </text>
        </g>
      );
    }
    return (
      <rect
        key={`${inst.typeKey}-${i}`}
        x={x}
        y={y}
        width={type.w}
        height={type.d}
        rx={type.category === "rack" ? 0.04 : 0.08}
        fill={color}
        fillOpacity={type.category === "rack" ? 0.75 : 0.28}
        stroke={delta ? C.green : color}
        strokeWidth={delta ? 0.12 : 0.05}
        style={{ cursor: "pointer" }}
        onMouseMove={(e) => {
          const tip = tipFor(type);
          show(e, tip.title, tip.lines, tip.sub);
        }}
        onMouseLeave={hide}
      />
    );
  };

  const zoneName = (z: Zone) => t(`diagrams.common.zone.${z}`);

  // 比例尺刻度
  const scaleTicks = useMemo(() => {
    const n = Math.floor(geo.roomW / geo.step);
    return Array.from({ length: n + 1 }, (_, i) => i * geo.step);
  }, [geo.roomW, geo.step]);

  const subtitle = tpl(t("diagrams.floor.subtitle"), {
    config: model.source.configName,
    criterion: model.source.criterion,
    generation: model.source.generation,
  });

  return (
    <DiagramFrame
      title={t("diagrams.floor.title")}
      subtitle={subtitle}
      right={
        <>
          <MetricChip label={t("diagrams.floor.metrics.itLoad")} value={fmtMw(model.metrics.itPowerMw)} unit="MW" />
          <MetricChip label={t("diagrams.floor.metrics.cooling")} value={fmtMw(model.metrics.coolingPowerMw)} unit="MW" />
          <MetricChip label={t("diagrams.floor.metrics.loss")} value={fmtMw(model.metrics.conversionLossMw)} unit="MW" />
          <MetricChip label={t("diagrams.floor.metrics.density")} value={fmt(model.metrics.powerDensityKwM2, 1)} unit="kW/m²" />
        </>
      }
    >
      <div ref={hostRef} className="relative">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${geo.W} ${geo.H}`}
            className="h-auto w-full min-w-[720px] select-none print:min-w-0"
            role="img"
            aria-label={t("diagrams.floor.title")}
          >
            {/* 三區外框＋標題 */}
            {ZONE_ORDER.map((zone) => {
              const room = model.rooms[zone];
              const y = geo.zoneY[zone];
              return (
                <g key={zone}>
                  <text
                    x={M}
                    y={y - 0.55}
                    fontSize={1.15}
                    fontWeight={700}
                    fill={C.text0}
                  >
                    {zoneName(zone)}
                  </text>
                  <text
                    x={M + geo.roomW}
                    y={y - 0.55}
                    fontSize={0.9}
                    textAnchor="end"
                    fill={C.text2}
                    fontFamily={MONO}
                  >
                    {tpl(t("diagrams.floor.roomLabel"), {
                      w: fmt(room.w, 1),
                      d: fmt(room.d, 1),
                      a: fmt(room.areaM2, 0),
                    })}
                  </text>
                  <rect
                    x={M}
                    y={y}
                    width={room.w}
                    height={room.d}
                    fill={zone === "white" ? C.bg2 : C.bg1}
                    stroke={C.line}
                    strokeWidth={0.12}
                    rx={0.3}
                  />
                </g>
              );
            })}

            {/* Pod 分隔線（white 區） */}
            {podLines.lines.map((l) => (
              <g key={`pod-${l.pod}`}>
                <line
                  x1={M + 0.4}
                  x2={M + model.rooms.white.w - 0.4}
                  y1={geo.zoneY.white + l.y}
                  y2={geo.zoneY.white + l.y}
                  stroke={C.text2}
                  strokeWidth={0.07}
                  strokeDasharray="0.5 0.35"
                  opacity={0.7}
                />
                <text
                  x={M + model.rooms.white.w - 0.5}
                  y={geo.zoneY.white + l.y - 0.25}
                  fontSize={0.7}
                  textAnchor="end"
                  fill={C.text2}
                  fontFamily={MONO}
                >
                  {tpl(t("diagrams.floor.pod"), { n: l.pod + 1 })}
                </text>
              </g>
            ))}

            {/* 實例 */}
            {ZONE_ORDER.map((zone) => (
              <g key={`inst-${zone}`}>
                {drawItems[zone].map((d, i) => renderItem(d, zone, i))}
              </g>
            ))}

            {/* 比例尺 */}
            <g>
              {scaleTicks.map((v) => (
                <g key={`sc-${v}`}>
                  <line
                    x1={M + v}
                    x2={M + v}
                    y1={geo.H - 4}
                    y2={geo.H - 3.2}
                    stroke={C.text2}
                    strokeWidth={0.08}
                  />
                  <text
                    x={M + v}
                    y={geo.H - 2.2}
                    fontSize={0.8}
                    textAnchor="middle"
                    fill={C.text2}
                    fontFamily={MONO}
                  >
                    {v}
                  </text>
                </g>
              ))}
              <line
                x1={M}
                x2={M + scaleTicks[scaleTicks.length - 1]}
                y1={geo.H - 3.6}
                y2={geo.H - 3.6}
                stroke={C.text2}
                strokeWidth={0.08}
              />
              <text
                x={M + scaleTicks[scaleTicks.length - 1] + 1}
                y={geo.H - 2.2}
                fontSize={0.8}
                fill={C.text2}
              >
                {t("diagrams.floor.scaleUnit")}
              </text>
            </g>
          </svg>
        </div>
        {overlay}
      </div>

      {/* 型別圖例 */}
      <div className="mt-4">
        <Legend
          title={t("diagrams.floor.legend")}
          items={model.types.map((ty) => ({
            color: typeColor(ty),
            label: ty.name,
            sub: `×${fmt(ty.count)}`,
          }))}
        />
      </div>

      {/* 元件清單（BOM，以 model.types 為準 → 保證所有 BOM 型別出現） */}
      <div className="mt-5">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-2 print:text-gray-600">
          {t("diagrams.floor.bom.title")}
        </div>
        <div className="overflow-x-auto rounded-lg border border-line print:border-gray-300">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-bg-2 text-left text-text-2 print:bg-gray-100 print:text-gray-600">
                <th className="px-3 py-2 font-medium">{t("diagrams.floor.bom.type")}</th>
                <th className="px-3 py-2 font-medium">{t("diagrams.floor.bom.model")}</th>
                <th className="px-3 py-2 font-medium">{t("diagrams.floor.bom.vendor")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("diagrams.floor.bom.qty")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("diagrams.floor.bom.unitsPerPod")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("diagrams.floor.bom.capacity")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("diagrams.floor.bom.power")}</th>
              </tr>
            </thead>
            <tbody>
              {model.types.map((ty) => (
                <tr
                  key={ty.key}
                  className="border-t border-line text-text-1 print:border-gray-200 print:text-gray-700"
                >
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: typeColor(ty) }}
                      />
                      {t(categoryLabelKey(ty.category))}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-text-0 print:text-black">{ty.name}</td>
                  <td className="px-3 py-1.5">
                    <span className={isDeltaVendor(ty.vendor) ? "text-green" : undefined}>
                      {ty.vendor ?? t("diagrams.common.na")}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">{fmt(ty.count)}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {ty.unitsPerPod != null ? `×${fmt(ty.unitsPerPod)}` : t("diagrams.common.na")}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {ty.capacityKw != null ? fmtKw(ty.capacityKw) : t("diagrams.common.na")}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {ty.powerMw != null ? fmtMw(ty.powerMw) : t("diagrams.common.na")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DiagramFrame>
  );
}
