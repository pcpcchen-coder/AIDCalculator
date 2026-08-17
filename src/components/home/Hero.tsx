import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';

const HeroParticles = lazy(() => import('@/components/home/HeroParticles'));

function CountUp({ target, start, duration = 1400 }: { target: number; start: boolean; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let rafId = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, start, duration]);
  return <>{v}</>;
}

export default function Hero() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const [statsStart, setStatsStart] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  useEffect(() => {
    const timer = setTimeout(() => setStatsStart(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const title = t('home.hero.title');
  const heroStats: Array<{ value: number; suffix: string; label: string }> = [
    { value: 65, suffix: '+', label: t('home.hero.stats.equipment') },
    { value: 4, suffix: '', label: t('home.hero.stats.dcTypes') },
    { value: 19, suffix: '', label: t('home.hero.stats.algorithms') },
    { value: 8, suffix: '', label: t('home.hero.stats.infra') },
  ];

  return (
    <section ref={sectionRef} className="relative flex min-h-[92dvh] items-center overflow-hidden">
      {/* Layer 1：背景照片（壓暗至 35%） */}
      <img
        src="/hero-datacenter.jpg"
        alt={t('home.hero.bgAlt')}
        className="absolute inset-0 h-full w-full object-cover brightness-[0.35]"
      />
      {/* Layer 2：Three.js 粒子層 */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <HeroParticles />
        </Suspense>
      </div>
      {/* Layer 3：底部漸層融入內容 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-bg-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg-0/80 via-bg-0/30 to-transparent" />

      {/* 內容欄 */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-20 md:px-8"
      >
        <div className="max-w-[720px]">
          {/* 徽章列 */}
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <span className="rounded-full border border-accent/60 bg-bg-1/60 px-3 py-1 font-mono text-xs text-accent backdrop-blur">
              arXiv:2604.09616
            </span>
            <span className="rounded-full border border-line bg-bg-1/60 px-3 py-1 font-mono text-xs text-text-1 backdrop-blur">
              DCGen 1.1
            </span>
            <span className="rounded-full border border-line bg-bg-1/60 px-3 py-1 text-xs text-text-1 backdrop-blur">
              {t('home.hero.badgeRepo')}
            </span>
          </motion.div>

          {/* 主標：字元級 stagger */}
          <h1 className="mt-6 font-sans text-5xl font-black leading-[1.15] tracking-[-0.02em] text-text-0 md:text-7xl">
            {title.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 24, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 + i * 0.04 }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-4 font-display text-xl font-medium text-text-0 md:text-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.65 }}
          >
            {t('home.hero.subtitle')}
          </motion.p>

          <motion.p
            className="mt-5 max-w-[560px] text-sm leading-relaxed text-text-1 md:text-base"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
          >
            {t('home.hero.desc')}
          </motion.p>

          {/* CTA 列 */}
          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.95 }}
          >
            <Link
              to="/generator"
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-bg-0 shadow-glow transition-all duration-200 hover:scale-[1.02] hover:shadow-glow-strong active:scale-[0.97]"
            >
              {t('home.cta.start')}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-1/50 px-6 py-3 text-sm font-medium text-text-0 backdrop-blur transition-all duration-200 hover:scale-[1.02] hover:border-accent/60 hover:text-accent active:scale-[0.97]"
            >
              {t('home.hero.ctaCatalog')}
            </Link>
          </motion.div>

          {/* 統計條 */}
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
            {heroStats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                {i > 0 && <span className="hidden h-8 w-px bg-line sm:block" />}
                <div>
                  <div className="font-mono text-2xl font-bold text-text-0 md:text-3xl">
                    <CountUp target={s.value} start={statsStart} />
                    {s.suffix}
                  </div>
                  <div className="text-xs text-text-2">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
