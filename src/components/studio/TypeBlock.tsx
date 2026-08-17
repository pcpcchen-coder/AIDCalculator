import { useRef, useState } from 'react';
import type { LayoutType, PlacedOverride } from '@contracts/layout';
import { tpl, useI18n } from '@/i18n';
import {
  MIN_BLOCK,
  clamp,
  colorOf,
  fmtM,
  isDeltaVendor,
  snap,
} from '@/components/studio/editorUtils';

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  orig: PlacedOverride;
  mode: 'move' | 'resize';
  ratio: number;
}

interface TypeBlockProps {
  type: LayoutType;
  rect: PlacedOverride;
  zoom: number;
  roomW: number;
  roomD: number;
  lockRatio: boolean;
  onCommit: (key: string, rect: PlacedOverride) => void;
}

/** 聚合塊：一個 BOM 設備型別（或機架型別）一塊，可拖放、可調尺寸 */
export default function TypeBlock({
  type,
  rect,
  zoom,
  roomW,
  roomD,
  lockRatio,
  onCommit,
}: TypeBlockProps) {
  const { t } = useI18n();
  const [live, setLive] = useState<PlacedOverride | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const cur = live ?? rect;
  const color = colorOf(type);
  const delta = isDeltaVendor(type.vendor);

  const begin = (e: React.PointerEvent<HTMLDivElement>, mode: DragState['mode']) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      orig: { ...cur },
      mode,
      ratio: cur.d > 0 ? cur.w / cur.d : 1,
    };
    setLive({ ...cur });
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = (e.clientX - d.startClientX) / zoom;
    const dy = (e.clientY - d.startClientY) / zoom;
    if (d.mode === 'move') {
      const x = snap(clamp(d.orig.x + dx, 0, Math.max(0, roomW - cur.w)));
      const y = snap(clamp(d.orig.y + dy, 0, Math.max(0, roomD - cur.d)));
      setLive({ ...cur, x, y });
      setTip(tpl(t('studio.tip.position'), { x: fmtM(x), y: fmtM(y) }));
    } else {
      let w = snap(clamp(d.orig.w + dx, MIN_BLOCK, Math.max(MIN_BLOCK, roomW - cur.x)));
      let h = snap(clamp(d.orig.d + dy, MIN_BLOCK, Math.max(MIN_BLOCK, roomD - cur.y)));
      if (lockRatio && d.ratio > 0) {
        h = snap(clamp(w / d.ratio, MIN_BLOCK, Math.max(MIN_BLOCK, roomD - cur.y)));
        w = snap(clamp(h * d.ratio, MIN_BLOCK, Math.max(MIN_BLOCK, roomW - cur.x)));
      }
      setLive({ ...cur, w, d: h });
      setTip(tpl(t('studio.tip.size'), { w: fmtM(w), d: fmtM(h) }));
    }
  };

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setTip(null);
    if (live) onCommit(type.key, live);
    setLive(null);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={type.name}
      className="group absolute flex touch-none flex-col overflow-hidden rounded-md border px-1.5 py-1 text-left select-none"
      style={{
        left: cur.x * zoom,
        top: cur.y * zoom,
        width: Math.max(cur.w * zoom, 64),
        height: Math.max(cur.d * zoom, 40),
        borderColor: color,
        backgroundColor: `${color}1f`,
        boxShadow: live ? `0 0 16px ${color}55` : undefined,
        cursor: live ? 'grabbing' : 'grab',
        zIndex: live ? 20 : 10,
      }}
      onPointerDown={(e) => begin(e, 'move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="flex min-w-0 items-center gap-1">
        {delta && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-green"
            title={t('studio.block.deltaVendor')}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-0">
          {type.name}
        </span>
        <span
          className="shrink-0 rounded px-1 font-mono text-[10px] font-semibold"
          style={{ backgroundColor: `${color}33`, color }}
        >
          {tpl(t('studio.block.count'), { n: type.count })}
        </span>
      </div>
      <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-text-2">
        {type.vendor && <span className="truncate">{type.vendor}</span>}
        <span className="ml-auto shrink-0 font-mono">
          {fmtM(type.w)} × {fmtM(type.d)} m
        </span>
      </div>

      {tip && (
        <div className="pointer-events-none absolute -top-7 left-0 z-30 rounded border border-line bg-bg-0 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-accent shadow-glow">
          {tip}
        </div>
      )}

      {/* resize handle（右下角） */}
      <div
        className="absolute right-0 bottom-0 h-3.5 w-3.5 cursor-nwse-resize touch-none rounded-tl-md border-t border-l opacity-60 transition-opacity group-hover:opacity-100"
        style={{ borderColor: color, backgroundColor: `${color}44` }}
        onPointerDown={(e) => begin(e, 'resize')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
    </div>
  );
}

interface InstanceBlockProps {
  type: LayoutType;
  index: number;
  x: number;
  y: number;
  zoom: number;
  roomW: number;
  roomD: number;
  onCommit: (x: number, y: number) => void;
}

/** 展開實例模式下的個別設備小塊（可拖放，寫入 instanceOverrides） */
export function InstanceBlock({ type, index, x, y, zoom, roomW, roomD, onCommit }: InstanceBlockProps) {
  const { t } = useI18n();
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ pointerId: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const cur = live ?? { x, y };
  const color = colorOf(type);
  const wPx = Math.max(type.w * zoom, 10);
  const dPx = Math.max(type.d * zoom, 10);

  return (
    <div
      className="absolute touch-none rounded-[3px] border select-none"
      title={`${type.name} #${index + 1}`}
      style={{
        left: cur.x * zoom,
        top: cur.y * zoom,
        width: wPx,
        height: dPx,
        borderColor: color,
        backgroundColor: `${color}2e`,
        cursor: live ? 'grabbing' : 'grab',
        zIndex: live ? 20 : 5,
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y };
        setLive({ ...cur });
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        const nx = snap(clamp(d.ox + (e.clientX - d.sx) / zoom, 0, Math.max(0, roomW - type.w)));
        const ny = snap(clamp(d.oy + (e.clientY - d.sy) / zoom, 0, Math.max(0, roomD - type.d)));
        setLive({ x: nx, y: ny });
      }}
      onPointerUp={(e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        dragRef.current = null;
        if (live) onCommit(live.x, live.y);
        setLive(null);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setLive(null);
      }}
    >
      {live && (
        <div className="pointer-events-none absolute -top-6 left-0 z-30 rounded border border-line bg-bg-0 px-1 py-0.5 font-mono text-[9px] whitespace-nowrap text-accent shadow-glow">
          {tpl(t('studio.tip.position'), { x: fmtM(cur.x), y: fmtM(cur.y) })}
        </div>
      )}
      {wPx >= 26 && dPx >= 16 && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[9px] text-text-1">
          {index + 1}
        </span>
      )}
    </div>
  );
}
