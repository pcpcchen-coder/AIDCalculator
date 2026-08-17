import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** H2 區塊標題：左側 3px cyan 短豎線＋標題，右側可放說明/連結 */
export default function SectionHeading({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <motion.div
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div>
        <div className="flex items-center gap-3">
          <motion.span
            className="block h-7 w-[3px] origin-top rounded-full bg-accent"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          <h2 className="text-xl font-bold text-text-0 md:text-2xl">{title}</h2>
        </div>
        {subtitle && <p className="mt-2 pl-[15px] text-sm text-text-1">{subtitle}</p>}
      </div>
      {aside && <div className="text-sm text-text-1">{aside}</div>}
    </motion.div>
  );
}
