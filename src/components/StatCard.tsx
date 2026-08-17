import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

export type StatCardVariant = 'accent' | 'power' | 'cool' | 'violet' | 'green';

const VARIANT_STYLES: Record<StatCardVariant, { bar: string; icon: string }> = {
  accent: { bar: 'bg-accent', icon: 'text-accent' },
  power: { bar: 'bg-power', icon: 'text-power' },
  cool: { bar: 'bg-cool', icon: 'text-cool' },
  violet: { bar: 'bg-violet', icon: 'text-violet' },
  green: { bar: 'bg-green', icon: 'text-green' },
};

/** 1.2s count-up，進入視口才啟動 */
function useCountUp(target: number, start: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let rafId = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, start, duration]);
  return value;
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: ReactNode;
  variant?: StatCardVariant;
  hint?: ReactNode;
  decimals?: number;
  delay?: number;
  className?: string;
}

export default function StatCard({
  label,
  value,
  suffix,
  icon,
  variant = 'accent',
  hint,
  decimals = 0,
  delay = 0,
  className,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const display = useCountUp(value, inView);
  const styles = VARIANT_STYLES[variant];

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-line bg-bg-2 p-5 transition-[border-color,box-shadow] duration-200 hover:border-[rgba(34,211,238,0.4)] hover:shadow-glow',
        className,
      )}
    >
      {/* 左側 3px 色條 */}
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', styles.bar)} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-1">{label}</span>
        {icon && <span className={cn('h-4 w-4', styles.icon)}>{icon}</span>}
      </div>
      <div className="mt-3 font-mono text-3xl font-bold text-text-0 md:text-4xl">
        {formatted}
        {suffix && <span className="ml-1.5 text-base font-medium text-text-2">{suffix}</span>}
      </div>
      {hint && <div className="mt-2 text-xs text-text-2">{hint}</div>}
    </motion.div>
  );
}
