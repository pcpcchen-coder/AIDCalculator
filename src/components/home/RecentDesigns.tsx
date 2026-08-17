import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

export default function RecentDesigns() {
  const { t } = useI18n();

  // 靜態假資料（後續接 tRPC designs 列表）
  const recent = [
    {
      id: 'd-1042',
      name: t('home.recent.item1.name'),
      type: 'AI Training',
      typeClass: 'border-accent/50 bg-accent/10 text-accent',
      createdAt: t('home.recent.item1.time'),
      racks: '12,480',
      power: '52.3 MW',
      space: '8,940 m²',
      redundancy: 'N+1',
      cooling: 'Dry cooling',
    },
    {
      id: 'd-1041',
      name: t('home.recent.item2.name'),
      type: 'AI Inference',
      typeClass: 'border-cool/50 bg-cool/10 text-cool',
      createdAt: t('home.recent.item2.time'),
      racks: '864',
      power: '3.8 MW',
      space: '1,120 m²',
      redundancy: 'N+1',
      cooling: 'Air + DLC',
    },
    {
      id: 'd-1039',
      name: t('home.recent.item3.name'),
      type: 'Mixed',
      typeClass: 'border-violet/50 bg-violet/10 text-violet',
      createdAt: t('home.recent.item3.time'),
      racks: '6,210',
      power: '27.6 MW',
      space: '5,020 m²',
      redundancy: 'N+2',
      cooling: 'Evaporative',
    },
    {
      id: 'd-1037',
      name: t('home.recent.item4.name'),
      type: 'Cloud',
      typeClass: 'border-text-2/50 bg-bg-3 text-text-1',
      createdAt: t('home.recent.item4.time'),
      racks: '9,600',
      power: '18.4 MW',
      space: '7,300 m²',
      redundancy: '2N',
      cooling: 'Chilled water',
    },
    {
      id: 'd-1035',
      name: t('home.recent.item5.name'),
      type: 'AI Training',
      typeClass: 'border-accent/50 bg-accent/10 text-accent',
      createdAt: t('home.recent.item5.time'),
      racks: '2,048',
      power: '9.1 MW',
      space: '1,640 m²',
      redundancy: 'x2N-1',
      cooling: 'Dry cooling',
    },
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
      <SectionHeading
        title={t('home.recent.title')}
        aside={
          <Link
            to="/generator#saved"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
          >
            {t('home.recent.viewAll')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        {recent.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group w-[320px] shrink-0 rounded-xl border border-line bg-bg-2 p-5 transition-[border-color,box-shadow] duration-200 hover:border-[rgba(34,211,238,0.4)] hover:shadow-glow"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 font-mono text-xs',
                  d.typeClass,
                )}
              >
                {d.type}
              </span>
              <span className="text-xs text-text-2">{d.createdAt}</span>
            </div>
            <h3 className="mt-3 text-base font-medium text-text-0">{d.name}</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <div className="font-mono text-sm font-bold text-text-0">{d.racks}</div>
                <div className="text-xs text-text-2">{t('home.recent.racks')}</div>
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-text-0">{d.power}</div>
                <div className="text-xs text-text-2">{t('home.recent.power')}</div>
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-text-0">{d.space}</div>
                <div className="text-xs text-text-2">White space</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <div className="flex gap-2">
                <span className="rounded border border-line bg-bg-1 px-2 py-0.5 font-mono text-xs text-power">
                  {d.redundancy}
                </span>
                <span className="rounded border border-line bg-bg-1 px-2 py-0.5 font-mono text-xs text-cool">
                  {d.cooling}
                </span>
              </div>
              <Link
                to={`/generator?design=${d.id}`}
                className="inline-flex translate-x-1 items-center gap-1 text-xs text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
              >
                {t('home.recent.open')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
