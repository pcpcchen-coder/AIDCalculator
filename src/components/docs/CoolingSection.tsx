import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Snowflake, Droplets, Waves } from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';
import ScrollDrawSvg from './ScrollDrawSvg';

const COOLING_PATHS = [
  {
    icon: Snowflake,
    titleKey: 'docs.cooling.dry.title',
    descKey: 'docs.cooling.dry.desc',
    link: '/catalog?category=dry_cooler',
  },
  {
    icon: Droplets,
    titleKey: 'docs.cooling.evap.title',
    descKey: 'docs.cooling.evap.desc',
    link: '/catalog?category=cooling_tower',
  },
  {
    icon: Waves,
    titleKey: 'docs.cooling.cdu.title',
    descKey: 'docs.cooling.cdu.desc',
    link: '/catalog?category=cdu',
  },
];

/** Section 5 — 冷卻鏈：滾動描邊 SVG＋三欄短文 */
export default function CoolingSection() {
  const { t } = useI18n();
  return (
    <DocSection id="cooling" title={t('docs.cooling.title')}>
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          {t('docs.cooling.body')}
        </p>

        {/* 全寬 cooling-loop.svg：滾動進度描邊繪出 */}
        <ScrollDrawSvg src="/cooling-loop.svg" label={t('docs.cooling.svgLabel')} />

        <div className="grid gap-4 md:grid-cols-3">
          {COOLING_PATHS.map((c, i) => (
            <motion.div
              key={c.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
              className="flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
            >
              <c.icon className="h-5 w-5 text-cool" />
              <h3 className="mt-3 font-mono text-sm font-medium text-text-0">{t(c.titleKey)}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-1">{t(c.descKey)}</p>
              <Link
                to={c.link}
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
              >
                {t('docs.common.viewCatalog')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DocSection>
  );
}
