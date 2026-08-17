import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useCountUp } from './use-animated-number';

const TITLE = '模型說明';

const STATS = [
  { value: 19, suffix: '條', label: '算法' },
  { value: 8, suffix: '類', label: '設備' },
  { value: 4, suffix: '類', label: '資料中心' },
];

function HeroStat({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const display = useCountUp(value, start, 1200, 400);
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-3xl font-bold text-text-0 md:text-4xl">
        {Math.round(display)}
        <span className="ml-1 text-base font-medium text-text-2">{suffix}</span>
      </span>
      <span className="mt-1 text-xs text-text-2">{label}</span>
    </div>
  );
}

/** Section 1 — 頁首 Hero（精簡版，40vh）：藍圖網格＋右側淡化冷卻迴路圖 */
export default function DocsHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className="blueprint-grid relative overflow-hidden border-b border-line bg-bg-1">
      {/* 右側淡化 cooling-loop.svg 裝飾（15% 透明度） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] opacity-15 md:block"
        style={{
          backgroundImage: 'url(/cooling-loop.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          maskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
        }}
      />
      <div className="relative mx-auto flex min-h-[40dvh] max-w-[1400px] flex-col justify-center gap-8 px-4 py-14 md:flex-row md:items-end md:justify-between md:px-8">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center rounded-full border border-accent/50 bg-accent/10 px-3 py-1 font-mono text-xs tracking-[0.08em] text-accent"
          >
            arXiv:2604.09616
          </motion.span>
          {/* 標題字元級 stagger 0.03s */}
          <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] text-text-0 md:text-6xl">
            {TITLE.split('').map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                className="inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.1 + i * 0.03 }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="mt-4 max-w-xl text-sm leading-relaxed text-text-1 md:text-base"
          >
            DCGen（Data Center configuration Generator）由 University of Chicago 與 Argonne
            National Laboratory 提出：給定 IT 需求，自動推導冷卻與配電基礎設施的空間、功率與設備清單。本平台為其
            Web 資料庫實作。
          </motion.p>
        </div>
        {/* 右側小統計（Mono），count-up 延遲 0.4s */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex shrink-0 gap-8 md:flex-col md:items-end md:gap-5 md:pb-1"
        >
          {STATS.map((s) => (
            <HeroStat key={s.label} {...s} start={inView} />
          ))}
        </motion.div>
      </div>
      <div className="energy-line relative" />
    </div>
  );
}
