import { useEffect, useRef, useState } from 'react';

/**
 * 數值變動時以 rAF 由前一值 ease-out 過渡到新值（計算器結果 count-up 用）。
 * reduced-motion 時直接跳到目標值。
 */
export function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    if (reduce || from === target) {
      fromRef.current = target;
      const rafId = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(rafId);
    }
    let rafId = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = from + (target - from) * eased;
      setDisplay(value);
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      fromRef.current = target;
    };
  }, [target, duration]);

  return display;
}

/** 進入視口才啟動的一次性 count-up（Hero 統計用） */
export function useCountUp(target: number, start: boolean, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const rafId = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(rafId);
    }
    let rafId = 0;
    let timeoutId = 0;
    let t0 = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    const begin = (now: number) => {
      t0 = now;
      rafId = requestAnimationFrame(tick);
    };
    if (delay > 0) {
      timeoutId = window.setTimeout(() => {
        rafId = requestAnimationFrame(begin);
      }, delay);
    } else {
      rafId = requestAnimationFrame(begin);
    }
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [target, start, duration, delay]);
  return value;
}
