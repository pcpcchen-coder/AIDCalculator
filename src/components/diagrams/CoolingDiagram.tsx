/**
 * 冷卻系統架構圖（CoolingDiagram）
 * 冷卻鏈：機架（熱負載 MW）→ CDU（每 pod ×N/pod）→ 冰水機 ×N → 散熱端
 * （乾冷卻器或冷卻水塔，依 result.input.heatRejectionMode）。
 * 去程熱水（amber →）／回程冷水（sky ←）雙向箭頭；每節點標型號、台數、
 * 容量 MW、功耗 MW、冗餘；底部冷卻功耗合計與占 IT 比例（以 result summary 為準）。
 */
import { useMemo } from "react";
import type { EquipmentCategory, GenerateResult } from "@contracts/dcgen";
import { REDUNDANCY_SLOTS } from "@contracts/dcgen";
import type { LayoutModel } from "@contracts/layout";
import { tpl, useI18n } from "@/i18n";
import { DiagramFrame, Legend, MetricChip } from "@/components/diagrams/lib/common";
import {
  C,
  CATEGORY_COLOR,
  MONO,
  NODE_TYPE_COLOR,
  fmt,
  fmtMw,
  isDeltaVendor,
} from "@/components/diagrams/lib/theme";
import { categoryLabelKey, pickResult } from "@/components/diagrams/lib/data";

interface CNode {
  id: string;
  title: string;
  tag: string;
  color: string;
  delta: boolean;
  lines: { k: string; v: string }[];
}

const NODE_W = 260;
const GAP = 150;
const M_X = 40;
const NODE_Y = 90;

function nodeH(lines: number): number {
  return 34 + lines * 16 + 14;
}

export default function CoolingDiagram({
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

    const redundancyFor = (cat: EquipmentCategory): string => {
      const slot = REDUNDANCY_SLOTS.find((s) => s.categories.includes(cat));
      return slot ? result.input.redundancy[slot.key] : "N+1";
    };

    const nodes: CNode[] = [];

    // ---------- 機架（IT 熱負載） ----------
    const rackLines: { k: string; v: string }[] = [
      { k: t("diagrams.cooling.heatLoad"), v: `${fmtMw(dc.it.totalPeakPowerMw)} MW` },
      { k: t("diagrams.common.count"), v: tpl(t("diagrams.electrical.racks"), { n: fmt(dc.it.totalRacks) }) },
      { k: t("diagrams.cooling.pods"), v: `×${fmt(dc.meta.pods || model.params.pods)}` },
    ];
    for (const nt of Object.keys(dc.it.rackCount)) {
      if (dc.it.rackCount[nt] > 0) {
        rackLines.push({
          k: t(`diagrams.nodeType.${nt}`),
          v: `${fmtMw(dc.it.peakPowerMw[nt] ?? 0)} MW`,
        });
      }
    }
    nodes.push({
      id: "it",
      title: t("diagrams.cooling.itRacks"),
      tag: t("diagrams.common.zone.white"),
      color: C.accent,
      delta: false,
      lines: rackLines,
    });

    // ---------- 冷卻鏈設備：CDU → chiller → 散熱端 ----------
    const heatCat: EquipmentCategory =
      result.input.heatRejectionMode === "Evaporative cooling" ? "cooling_tower" : "dry_cooler";
    const chain: EquipmentCategory[] = ["cdu", "chiller", heatCat];
    // 若實際 BOM 與模式不同（保險），改採 designs 中存在的散熱端
    const designs = nonIt.cooling.designs;
    const altHeat: EquipmentCategory = heatCat === "dry_cooler" ? "cooling_tower" : "dry_cooler";
    const effectiveChain = chain.filter((cat, i) => {
      if (i < 2) return !!designs[cat];
      return !!designs[cat] || !!designs[altHeat];
    });
    if (!designs[heatCat] && designs[altHeat]) {
      effectiveChain[effectiveChain.length - 1] = altHeat;
    }

    for (const cat of effectiveChain) {
      const entry = designs[cat];
      if (!entry) continue;
      const lines: { k: string; v: string }[] = [
        { k: t("diagrams.common.count"), v: `×${fmt(entry.totalCount)}` },
        { k: t("diagrams.cooling.capacity"), v: `${fmtMw(entry.totalCapacityMw)} MW` },
        {
          k: t("diagrams.cooling.powerDraw"),
          v: entry.maxPowerDemandMw != null ? `${fmtMw(entry.maxPowerDemandMw)} MW` : t("diagrams.common.na"),
        },
      ];
      if (entry.unitsPerPod != null) {
        lines.push({
          k: t("diagrams.electrical.perPodLabel"),
          v: tpl(t("diagrams.electrical.perPod"), { n: entry.unitsPerPod }),
        });
      }
      lines.push({ k: t("diagrams.common.redundancy"), v: redundancyFor(cat) });
      nodes.push({
        id: `${cat}-${entry.equipmentId}`,
        title: entry.name,
        tag: t(categoryLabelKey(cat)),
        color: CATEGORY_COLOR[cat],
        delta: isDeltaVendor(entry.vendor),
        lines,
      });
    }

    const totalCoolingMw = nonIt.cooling.summary.powerMw;
    const share = dc.it.totalPeakPowerMw > 0 ? (totalCoolingMw / dc.it.totalPeakPowerMw) * 100 : 0;
    return { nodes, totalCoolingMw, share, dc };
  }, [model, result, t]);

  if (!graph) return null;

  const n = graph.nodes.length;
  const W = M_X * 2 + n * NODE_W + (n - 1) * GAP;
  const maxH = Math.max(...graph.nodes.map((nd) => nodeH(nd.lines.length)));
  const H = NODE_Y + maxH + 70;

  const subtitle = tpl(t("diagrams.cooling.subtitle"), {
    config: model.source.configName,
    criterion: model.source.criterion,
    generation: model.source.generation,
  });

  const nodeX = (i: number) => M_X + i * (NODE_W + GAP);

  return (
    <DiagramFrame
      title={t("diagrams.cooling.title")}
      subtitle={subtitle}
      right={
        <>
          <MetricChip label={t("diagrams.floor.metrics.itLoad")} value={fmtMw(graph.dc.it.totalPeakPowerMw)} unit="MW" />
          <MetricChip label={t("diagrams.cooling.total")} value={fmtMw(graph.totalCoolingMw)} unit="MW" />
          <MetricChip
            label={t("diagrams.cooling.share")}
            value={tpl(t("diagrams.cooling.shareOfIt"), { p: fmt(graph.share, 1) })}
          />
        </>
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[860px] select-none print:min-w-0"
          role="img"
          aria-label={t("diagrams.cooling.title")}
        >
          <defs>
            <marker id="cool-arrow-hot" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill={C.power} />
            </marker>
            <marker id="cool-arrow-cold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill={C.cool} />
            </marker>
          </defs>

          {/* 雙向水流：去程熱水（amber →）／回程冷水（sky ←） */}
          {graph.nodes.slice(0, -1).map((_, i) => {
            const x1 = nodeX(i) + NODE_W;
            const x2 = nodeX(i + 1);
            const yHot = NODE_Y + maxH / 2 - 16;
            const yCold = NODE_Y + maxH / 2 + 16;
            return (
              <g key={`flow-${i}`}>
                <line
                  x1={x1 + 6}
                  y1={yHot}
                  x2={x2 - 8}
                  y2={yHot}
                  stroke={C.power}
                  strokeWidth={3}
                  markerEnd="url(#cool-arrow-hot)"
                  opacity={0.9}
                />
                <line
                  x1={x2 - 6}
                  y1={yCold}
                  x2={x1 + 8}
                  y2={yCold}
                  stroke={C.cool}
                  strokeWidth={3}
                  markerEnd="url(#cool-arrow-cold)"
                  opacity={0.9}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={yHot - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill={C.power}
                >
                  {t("diagrams.cooling.flow.hot")}
                </text>
                <text
                  x={(x1 + x2) / 2}
                  y={yCold + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fill={C.cool}
                >
                  {t("diagrams.cooling.flow.cold")}
                </text>
              </g>
            );
          })}

          {/* 節點 */}
          {graph.nodes.map((nd, i) => {
            const h = nodeH(nd.lines.length);
            const x = nodeX(i);
            return (
              <g key={nd.id}>
                <rect
                  x={x}
                  y={NODE_Y}
                  width={NODE_W}
                  height={h}
                  rx={10}
                  fill={C.bg2}
                  stroke={nd.delta ? C.green : nd.color}
                  strokeWidth={nd.delta ? 2.5 : 1.5}
                />
                <rect x={x} y={NODE_Y} width={5} height={h} rx={2.5} fill={nd.color} />
                <text x={x + 16} y={NODE_Y + 22} fontSize={13} fontWeight={700} fill={C.text0}>
                  {nd.title}
                </text>
                <text x={x + NODE_W - 12} y={NODE_Y + 21} fontSize={10} textAnchor="end" fill={C.text2}>
                  {nd.tag}
                </text>
                {nd.lines.map((ln, j) => (
                  <g key={j}>
                    <text x={x + 16} y={NODE_Y + 42 + j * 16} fontSize={11} fill={C.text2}>
                      {ln.k}
                    </text>
                    <text
                      x={x + NODE_W - 12}
                      y={NODE_Y + 42 + j * 16}
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
            );
          })}

          {/* 流向圖例（圖內） */}
          <text x={M_X} y={H - 18} fontSize={10} fill={C.text2} fontFamily={MONO}>
            {tpl(t("diagrams.cooling.chainNote"), { mode: t(`diagrams.cooling.mode.${result.input.heatRejectionMode === "Evaporative cooling" ? "tower" : "dry"}`) })}
          </text>
        </svg>
      </div>

      <div className="mt-4">
        <Legend
          title={t("diagrams.common.legend")}
          items={[
            { color: C.power, label: t("diagrams.cooling.flow.hot") },
            { color: C.cool, label: t("diagrams.cooling.flow.cold") },
            { color: C.green, label: t("diagrams.electrical.deltaFrame") },
            ...Object.entries(NODE_TYPE_COLOR).map(([nt, color]) => ({
              color,
              label: t(`diagrams.nodeType.${nt}`),
            })),
          ]}
        />
      </div>

      {/* 底部合計 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-line bg-bg-2/60 px-4 py-3 print:border-gray-300 print:bg-gray-100">
        <span className="text-xs text-text-2 print:text-gray-600">{t("diagrams.cooling.total")}</span>
        <span className="font-mono text-sm font-semibold text-cool print:text-sky-700">
          {fmtMw(graph.totalCoolingMw)} MW
        </span>
        <span className="text-xs text-text-2 print:text-gray-600">
          {tpl(t("diagrams.cooling.shareOfIt"), { p: fmt(graph.share, 1) })}
        </span>
      </div>
    </DiagramFrame>
  );
}
