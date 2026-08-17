import { useEffect, useRef, useState } from 'react';

/** count-up 動畫（800ms，ease-out cubic） */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;
    let rafId = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
}

export interface MiniStatItem {
  value: number;
  label: string;
}

/** 分頁下方迷你統計條：僅數字＋標籤，間以豎線（catalog.md §2） */
export default function MiniStats({ items }: { items: MiniStatItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-5">
          {i > 0 && <span className="h-4 w-px bg-line" aria-hidden />}
          <span className="flex items-baseline gap-1.5">
            <CountUpNumber value={item.value} />
            <span className="text-xs text-text-2">{item.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const v = useCountUp(value);
  return (
    <span className="font-mono text-lg font-bold tabular-nums text-text-0">
      {v.toLocaleString('en-US')}
    </span>
  );
}
