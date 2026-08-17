/**
 * 電路單線配置圖（ElectricalDiagram）
 * 依 DCGen 架構（論文 Figure 3 精神）自動產生正交走線：
 *   市電 Grid → MSB(IT) → UPS(IT) → PDU（每 pod）→ 機架（依 nodeType 分群）
 *   備援發電機(IT) 側接 MSB(IT)
 *   廠務支路：MSB(Facility) → UPS(Facility) → 冷卻負載（chiller/CDU/散熱端）
 *   發電機(Facility) 側接
 * 節點標示：設備型號、台數、單機容量 kW、總容量 MW、效率、冗餘、轉換損耗 MW。
 * 線條依電壓等級語意著色（HV / MV / LV，附圖例）。台達設備綠框。
 * 資料以 model.types 與 result 的 BOM（nonIt.power / cooling designs）為準。
 */
import { useMemo } from "react";
import type {
  EquipmentCategory,
  EquipmentDesignEntry,
  GenerateResult,
} from "@contracts/dcgen";
import { REDUNDANCY_SLOTS } from "@contracts/dcgen";
import type { LayoutModel } from "@contracts/layout";
import { tpl, useI18n } from "@/i18n";
import {
  DiagramFrame,
  Legend,
  MetricChip,
} from "@/components/diagrams/lib/common";
import {
  C,
  CATEGORY_COLOR,
  MONO,
  NODE_TYPE_COLOR,
  fmt,
  fmtKw,
  fmtMw,
  isDeltaVendor,
} from "@/components/diagrams/lib/theme";
import { categoryLabelKey, pickResult, typeMapOf } from "@/components/diagrams/lib/data";

// ---------------- 節點/連線模型 ----------------
type Voltage = "hv" | "mv" | "lv";
const V_COLOR: Record<Voltage, string> = { hv: C.power, mv: C.violet, lv: C.cool };

interface ENode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  tag?: string; // 類別小標
  color: string;
  delta: boolean;
  lines: { k: string; v: string }[];
}

interface ELink {
  pts: number[]; // x1,y1,x2,y2,...
  v: Voltage;
  dashed?: boolean;
  label?: string;
}

const NODE_W = 260;
const SIDE_W = 240;
const COL_SIDE_L = 20;
const COL_IT = 330;
const COL_FAC = 700;
const COL_SIDE_R = 1060;
const V_GAP = 40;
const CANVAS_W = 1340;

function nodeH(lines: number): number {
  return 30 + lines * 15 + 12;
}

export default function ElectricalDiagram({
  model,
  result,
}: {
  model: LayoutModel;
  result: GenerateResult;
}) {
  const { t } = useI18n();

  const graph = useMemo(() => {
    const picked = pickResult(result, model);
    if (!picked) return null;
    const { dc, nonIt } = picked;
    const typeByKey = typeMapOf(model);

    /** 冗餘標籤：優先 model.types，其次由 input.redundancy 推導 */
    const redundancyFor = (cat: EquipmentCategory, equipmentId: number, stage: "IT" | "Facility"): string => {
      const ty = typeByKey.get(`${cat}:${equipmentId}:${stage}`);
      if (ty?.redundancy) return ty.redundancy;
      const slot = REDUNDANCY_SLOTS.find((s) => s.categories.includes(cat));
      return slot ? result.input.redundancy[slot.key] : "N+1";
    };

    const powerLines = (
      entry: EquipmentDesignEntry,
      cat: EquipmentCategory,
      stage: "IT" | "Facility",
    ): { k: string; v: string }[] => {
      const unitKw = entry.totalCount > 0 ? (entry.totalCapacityMw * 1000) / entry.totalCount : 0;
      const lines = [
        { k: t("diagrams.common.count"), v: `×${fmt(entry.totalCount)}` },
        { k: t("diagrams.electrical.unitKw"), v: `${fmtKw(unitKw)} kW` },
        { k: t("diagrams.electrical.totalMw"), v: `${fmtMw(entry.totalCapacityMw)} MW` },
      ];
      if (entry.unitsPerPod != null) {
        lines.push({
          k: t("diagrams.electrical.perPodLabel"),
          v: tpl(t("diagrams.electrical.perPod"), { n: entry.unitsPerPod }),
        });
      }
      if (entry.powerEfficiency != null) {
        lines.push({ k: t("diagrams.common.efficiency"), v: `${fmt(entry.powerEfficiency * 100, 1)}%` });
      }
      lines.push({ k: t("diagrams.common.redundancy"), v: redundancyFor(cat, entry.equipmentId, stage) });
      lines.push({
        k: t("diagrams.electrical.loss"),
        v: entry.maxConversionPowerMw != null ? `${fmtMw(entry.maxConversionPowerMw)} MW` : t("diagrams.common.na"),
      });
      return lines;
    };

    const mkPowerNode = (
      entry: EquipmentDesignEntry,
      cat: EquipmentCategory,
      stage: "IT" | "Facility",
      x: number,
      w: number,
    ): Omit<ENode, "y"> => {
      const lines = powerLines(entry, cat, stage);
      return {
        id: `${stage}-${cat}-${entry.equipmentId}`,
        x,
        w,
        h: nodeH(lines.length),
        title: entry.name,
        tag: `${t(categoryLabelKey(cat))} · ${t(stage === "IT" ? "diagrams.electrical.stageIt" : "diagrams.electrical.stageFacility")}`,
        color: CATEGORY_COLOR[cat],
        delta: isDeltaVendor(entry.vendor),
        lines,
      };
    };

    const nodes: ENode[] = [];
    const links: ELink[] = [];

    // ---------- IT 鏈：Grid → MSB(IT) → UPS(IT) → PDU → 機架 ----------
    const cxIt = COL_IT + NODE_W / 2;
    const gridLines = [
      { k: t("diagrams.electrical.gridFeed"), v: `${fmtMw(dc.it.totalPeakPowerMw + nonIt.cooling.summary.powerMw + nonIt.power.summary.powerMw)} MW` },
      { k: t("diagrams.common.redundancy"), v: t("diagrams.electrical.gridRedundancy") },
    ];
    const grid: ENode = {
      id: "grid",
      x: COL_IT,
      y: 24,
      w: NODE_W,
      h: nodeH(gridLines.length),
      title: t("diagrams.electrical.grid"),
      tag: t("diagrams.electrical.stageIt"),
      color: C.power,
      delta: false,
      lines: gridLines,
    };
    nodes.push(grid);

    const itEntries = (["msb", "ups", "pdu"] as EquipmentCategory[])
      .map((cat) => ({ cat, entry: nonIt.power.designsIt[cat] }))
      .filter((e): e is { cat: EquipmentCategory; entry: EquipmentDesignEntry } => !!e.entry);

    let yCursor = grid.y + grid.h + V_GAP;
    let prev: ENode = grid;
    let prevV: Voltage = "hv";
    let msbIt: ENode | null = null;
    for (const { cat, entry } of itEntries) {
      const partial = mkPowerNode(entry, cat, "IT", COL_IT, NODE_W);
      const node: ENode = { ...partial, y: yCursor };
      nodes.push(node);
      links.push({ pts: [cxIt, prev.y + prev.h, cxIt, node.y], v: prevV });
      if (cat === "msb") msbIt = node;
      prev = node;
      prevV = cat === "msb" ? "mv" : "lv";
      yCursor += node.h + V_GAP;
    }
    const pduNode = prev; // IT 鏈最末（PDU 或最後存在的節點）

    // 機架分群（依 nodeType）
    const rackTypes = Object.keys(dc.it.rackCount).filter((nt) => dc.it.rackCount[nt] > 0);
    const rackBusTop = pduNode.y + pduNode.h;
    let rackBottom = rackBusTop;
    const rackNodes: ENode[] = [];
    rackTypes.forEach((nt) => {
      const totalMw = dc.it.peakPowerMw[nt] ?? 0;
      const count = dc.it.rackCount[nt];
      const lines = [
        { k: t("diagrams.common.count"), v: tpl(t("diagrams.electrical.racks"), { n: fmt(count) }) },
        { k: t("diagrams.common.unitCapacity"), v: `${fmtKw(count > 0 ? (totalMw * 1000) / count : 0)} kW` },
        { k: t("diagrams.electrical.totalMw"), v: `${fmtMw(totalMw)} MW` },
      ];
      const node: ENode = {
        id: `rack-${nt}`,
        x: COL_IT,
        y: yCursor,
        w: NODE_W,
        h: nodeH(lines.length),
        title: t(`diagrams.nodeType.${nt}`),
        tag: t("diagrams.electrical.rackGroup"),
        color: NODE_TYPE_COLOR[nt] ?? C.accent,
        delta: false,
        lines,
      };
      nodes.push(node);
      rackNodes.push(node);
      rackBottom = node.y + node.h;
      yCursor += node.h + V_GAP;
    });
    // 正交：PDU 底部垂直 LV 母線 → 各機架節點左側
    if (rackNodes.length > 0) {
      const busX = COL_IT - 24;
      const lastMid = rackNodes[rackNodes.length - 1].y + rackNodes[rackNodes.length - 1].h / 2;
      links.push({ pts: [cxIt, rackBusTop, cxIt, rackBusTop + 14, busX, rackBusTop + 14], v: "lv" });
      links.push({ pts: [busX, rackBusTop + 14, busX, lastMid], v: "lv" });
      for (const rn of rackNodes) {
        links.push({ pts: [busX, rn.y + rn.h / 2, rn.x, rn.y + rn.h / 2], v: "lv" });
      }
    }

    // ---------- 發電機(IT) 側接 MSB(IT) ----------
    const genItEntry = nonIt.power.designsIt.generator;
    if (genItEntry) {
      const partial = mkPowerNode(genItEntry, "generator", "IT", COL_SIDE_L, SIDE_W);
      const anchor = msbIt ?? grid;
      const node: ENode = { ...partial, y: anchor.y };
      nodes.push(node);
      links.push({
        pts: [node.x + node.w, node.y + node.h / 2, anchor.x, anchor.y + anchor.h / 2],
        v: "hv",
        dashed: true,
        label: t("diagrams.electrical.standby"),
      });
    }

    // ---------- 廠務支路：MSB(F) → UPS(F) → 冷卻負載 ----------
    const cxFac = COL_FAC + NODE_W / 2;
    const facEntries = (["msb", "ups"] as EquipmentCategory[])
      .map((cat) => ({ cat, entry: nonIt.power.designsFacility[cat] }))
      .filter((e): e is { cat: EquipmentCategory; entry: EquipmentDesignEntry } => !!e.entry);

    let facY = grid.y + grid.h + V_GAP;
    let facPrev: ENode | null = null;
    let facFirst: ENode | null = null;
    let facV: Voltage = "hv";
    for (const { cat, entry } of facEntries) {
      const partial = mkPowerNode(entry, cat, "Facility", COL_FAC, NODE_W);
      const node: ENode = { ...partial, y: facY };
      nodes.push(node);
      if (facPrev) {
        links.push({ pts: [cxFac, facPrev.y + facPrev.h, cxFac, node.y], v: facV });
      }
      facFirst = facFirst ?? node;
      facPrev = node;
      facV = cat === "msb" ? "mv" : "lv";
      facY += node.h + V_GAP;
    }

    // Grid → 廠務首節點（正交 HV）
    if (facFirst) {
      links.push({
        pts: [grid.x + grid.w, grid.y + grid.h / 2, cxFac, grid.y + grid.h / 2, cxFac, facFirst.y],
        v: "hv",
      });
    }

    // 冷卻負載（chiller / CDU / 散熱端）
    const loadCats: EquipmentCategory[] = ["chiller", "cdu", "dry_cooler", "cooling_tower"];
    const loadNodes: ENode[] = [];
    for (const cat of loadCats) {
      const entry = nonIt.cooling.designs[cat];
      if (!entry) continue;
      const lines = [
        { k: t("diagrams.common.count"), v: `×${fmt(entry.totalCount)}` },
        { k: t("diagrams.common.power"), v: entry.maxPowerDemandMw != null ? `${fmtMw(entry.maxPowerDemandMw)} MW` : t("diagrams.common.na") },
      ];
      const node: ENode = {
        id: `load-${cat}-${entry.equipmentId}`,
        x: COL_FAC,
        y: facY,
        w: NODE_W,
        h: nodeH(lines.length),
        title: entry.name,
        tag: `${t(categoryLabelKey(cat))} · ${t("diagrams.electrical.coolingLoads")}`,
        color: CATEGORY_COLOR[cat],
        delta: isDeltaVendor(entry.vendor),
        lines,
      };
      nodes.push(node);
      loadNodes.push(node);
      facY += node.h + 16;
    }
    // 廠務末節點 → 冷卻負載 LV 母線
    if (loadNodes.length > 0) {
      const from = facPrev ?? facFirst;
      const startY = from ? from.y + from.h : grid.y + grid.h;
      const busX = COL_FAC - 24;
      links.push({
        pts: [cxFac, startY, cxFac, startY + 14, busX, startY + 14, busX, loadNodes[loadNodes.length - 1].y + loadNodes[loadNodes.length - 1].h / 2],
        v: "lv",
      });
      for (const ln of loadNodes) {
        links.push({ pts: [busX, ln.y + ln.h / 2, ln.x, ln.y + ln.h / 2], v: "lv" });
      }
    }

    // ---------- 發電機(Facility) 側接 ----------
    const genFacEntry = nonIt.power.designsFacility.generator;
    if (genFacEntry && facFirst) {
      const partial = mkPowerNode(genFacEntry, "generator", "Facility", COL_SIDE_R, SIDE_W);
      const node: ENode = { ...partial, y: facFirst.y };
      nodes.push(node);
      links.push({
        pts: [node.x, node.y + node.h / 2, facFirst.x + facFirst.w, facFirst.y + facFirst.h / 2],
        v: "hv",
        dashed: true,
        label: t("diagrams.electrical.standby"),
      });
    }

    const H = Math.max(rackBottom, facY, ...nodes.map((n) => n.y + n.h)) + 30;
    return { nodes, links, H, nonIt, dc };
  }, [model, result, t]);

  if (!graph) return null;

  const subtitle = tpl(t("diagrams.electrical.subtitle"), {
    config: model.source.configName,
    criterion: model.source.criterion,
    generation: model.source.generation,
  });

  return (
    <DiagramFrame
      title={t("diagrams.electrical.title")}
      subtitle={subtitle}
      right={
        <>
          <MetricChip label={t("diagrams.floor.metrics.itLoad")} value={fmtMw(graph.dc.it.totalPeakPowerMw)} unit="MW" />
          <MetricChip label={t("diagrams.electrical.metrics.loss")} value={fmtMw(graph.nonIt.power.summary.powerMw)} unit="MW" />
          <MetricChip
            label={t("diagrams.electrical.metrics.safetyMargin")}
            value={`${fmt(result.input.safetyMargin * 100, 0)}%`}
          />
        </>
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CANVAS_W} ${graph.H}`}
          className="h-auto w-full min-w-[900px] select-none print:min-w-0"
          role="img"
          aria-label={t("diagrams.electrical.title")}
        >
          {/* 連線（正交） */}
          {graph.links.map((l, i) => (
            <g key={`lk-${i}`}>
              <polyline
                points={l.pts.join(" ")}
                fill="none"
                stroke={V_COLOR[l.v]}
                strokeWidth={l.dashed ? 2 : 2.5}
                strokeDasharray={l.dashed ? "7 5" : undefined}
                opacity={0.85}
              />
              {l.label ? (
                <text
                  x={(l.pts[0] + l.pts[l.pts.length - 2]) / 2}
                  y={l.pts[1] - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill={C.text2}
                  fontFamily={MONO}
                >
                  {l.label}
                </text>
              ) : null}
            </g>
          ))}

          {/* 節點 */}
          {graph.nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={8}
                fill={C.bg2}
                stroke={n.delta ? C.green : n.color}
                strokeWidth={n.delta ? 2.5 : 1.5}
              />
              <rect x={n.x} y={n.y} width={4} height={n.h} rx={2} fill={n.color} />
              <text x={n.x + 14} y={n.y + 20} fontSize={13} fontWeight={700} fill={C.text0}>
                {n.title}
              </text>
              {n.tag ? (
                <text x={n.x + n.w - 10} y={n.y + 19} fontSize={10} textAnchor="end" fill={C.text2}>
                  {n.tag}
                </text>
              ) : null}
              {n.lines.map((ln, i) => (
                <g key={i}>
                  <text x={n.x + 14} y={n.y + 38 + i * 15} fontSize={11} fill={C.text2}>
                    {ln.k}
                  </text>
                  <text
                    x={n.x + n.w - 12}
                    y={n.y + 38 + i * 15}
                    fontSize={11}
                    textAnchor="end"
                    fill={C.text1}
                    fontFamily={MONO}
                  >
                    {ln.v}
                  </text>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* 電壓等級圖例 */}
      <div className="mt-4">
        <Legend
          title={t("diagrams.electrical.voltage.title")}
          items={[
            { color: V_COLOR.hv, label: t("diagrams.electrical.voltage.hv") },
            { color: V_COLOR.mv, label: t("diagrams.electrical.voltage.mv") },
            { color: V_COLOR.lv, label: t("diagrams.electrical.voltage.lv") },
            { color: C.green, label: t("diagrams.electrical.deltaFrame") },
          ]}
        />
      </div>
    </DiagramFrame>
  );
}
