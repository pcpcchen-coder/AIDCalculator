/**
 * 配置圖共用 UI：外框（標題列＋Framer Motion 淡入）、指標 chip、圖例。
 * Tooltip hook 見 ./useSvgTooltip。
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------- 外框 ----------------
export function DiagramFrame({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-line bg-bg-1 print:border-gray-300 print:bg-white"
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line bg-bg-2/60 px-4 py-3 print:bg-gray-100">
        <h3 className="font-display text-sm font-semibold tracking-wide text-text-0 print:text-black">
          {title}
        </h3>
        {subtitle ? (
          <span className="text-xs text-text-2 print:text-gray-600">{subtitle}</span>
        ) : null}
        {right ? <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </motion.section>
  );
}

/** 標題列右側的指標 chip（數值用 JetBrains Mono） */
export function MetricChip({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-line bg-bg-2 px-2 py-1 text-[11px] text-text-2 print:border-gray-300 print:bg-white print:text-gray-600">
      {label}
      <span className="font-mono text-xs font-semibold text-accent print:text-cyan-700">
        {value}
      </span>
      {unit ? <span className="text-[10px]">{unit}</span> : null}
    </span>
  );
}

// ---------------- 圖例 ----------------
export interface LegendItem {
  color: string;
  label: string;
  sub?: string;
}

export function Legend({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-2 print:text-gray-600">
        {title}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs text-text-1 print:text-gray-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm border border-black/30"
              style={{ backgroundColor: it.color }}
            />
            {it.label}
            {it.sub ? <span className="font-mono text-[10px] text-text-2">{it.sub}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
