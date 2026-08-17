/**
 * SVG hover tooltip hook：於事件處理中計算位置（避免 render 期間存取 ref），
 * 回傳 hostRef / show / hide / overlay。
 */
import { useCallback, useRef, useState } from "react";

export interface TipLine {
  k: string;
  v: string;
}
export interface TipState {
  x: number;
  y: number;
  title: string;
  sub?: string;
  lines: TipLine[];
}

export function useSvgTooltip() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const show = useCallback(
    (e: React.MouseEvent, title: string, lines: TipLine[], sub?: string) => {
      const host = hostRef.current;
      if (!host) return;
      const r = host.getBoundingClientRect();
      const rawX = e.clientX - r.left;
      const x = Math.max(100, Math.min(rawX, host.clientWidth - 140));
      setTip({ x, y: e.clientY - r.top, title, sub, lines });
    },
    [],
  );
  const hide = useCallback(() => setTip(null), []);

  const overlay = tip ? (
    <div
      className="pointer-events-none absolute z-20 min-w-[180px] max-w-[280px] rounded-lg border border-line bg-bg-0/95 px-3 py-2 shadow-xl shadow-black/40"
      style={{
        left: tip.x,
        top: Math.max(8, tip.y - 12),
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="text-xs font-semibold text-text-0">{tip.title}</div>
      {tip.sub ? <div className="text-[10px] text-text-2">{tip.sub}</div> : null}
      <div className="mt-1 space-y-0.5">
        {tip.lines.map((l, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-text-2">{l.k}</span>
            <span className="font-mono text-text-1">{l.v}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return { hostRef, show, hide, overlay };
}
