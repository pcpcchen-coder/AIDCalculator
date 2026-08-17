import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** 表單輸入基礎樣式（design.md §7.5） */
export const inputClass = (invalid?: boolean) =>
  cn(
    'w-full rounded-lg border bg-bg-1 px-3 py-2.5 text-sm text-text-0 placeholder:text-text-2',
    'transition-colors focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(34,211,238,.15)]',
    invalid ? 'border-red' : 'border-line',
  );

interface FieldProps {
  label: ReactNode;
  error?: string;
  children: ReactNode;
  hint?: ReactNode;
}

/** 欄位容器：標籤＋輸入＋中文錯誤訊息（shake 動畫 300ms） */
export function Field({ label, error, children, hint }: FieldProps) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-text-1">{label}</span>
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key={error}
            className="mt-1 text-xs text-red"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className="mt-1 text-xs text-text-2">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
