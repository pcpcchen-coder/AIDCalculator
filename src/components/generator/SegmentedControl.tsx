import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  /** 每個實例必須唯一（Framer Motion layoutId 滑塊用） */
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

/** 膠囊 segmented control：選中段 bg-2 + cyan 文字 + layoutId 滑塊（design.md §7.5） */
export default function SegmentedControl<T extends string>({
  id,
  value,
  onChange,
  options,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'flex flex-wrap gap-1 rounded-lg border border-line bg-bg-1 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active ? 'text-accent' : 'text-text-1 hover:text-text-0',
              opt.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-md border border-accent/30 bg-bg-2 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
