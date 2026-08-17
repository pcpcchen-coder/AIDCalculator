import { motion } from 'framer-motion';
import { AlertTriangle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';
import { DELTA_PS_URL } from './docs-data';

/** 收錄廠商名單（首筆為台達，名稱走 i18n；其餘為品牌原名不譯） */
const VENDOR_KEYS: string[] = [
  'docs.sources.vendorDelta',
  'Vertiv',
  'CoolIT',
  'Motivair',
  'STULZ',
  'Evapco',
  'Carrier',
  'YORK',
  'Kelvion',
  'LU-VE',
  'BAC',
  'SPX Marley',
  'APC',
  'Schneider Electric',
  'Eaton',
  'Huawei',
  'ABB',
  'Caterpillar',
  'Cummins',
  'Kohler',
  'mtu',
];

const DELTA_PRODUCTS = [
  { name: 'Modulon DPH Gen3', specKey: 'docs.sources.delta.p1.spec' },
  { name: 'Ultron DPS / DPM', specKey: 'docs.sources.delta.p2.spec' },
  { name: 'GoCool L2L CDU', specKey: 'docs.sources.delta.p3.spec' },
  { name: 'In-Rack CDU', specKey: 'docs.sources.delta.p4.spec' },
  { name: 'rPDU ViLink', specKey: 'docs.sources.delta.p5.spec' },
];

/** Section 9 — 資料來源：聲明卡＋廠商徽章牆＋台達專段 */
export default function SourcesSection() {
  const { t } = useI18n();
  return (
    <DocSection id="sources" title={t('docs.sources.title')}>
      <div className="flex flex-col gap-6">
        {/* 聲明卡（amber 邊） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex gap-3 rounded-xl border border-power/50 bg-power/5 p-5"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-power" />
          <p className="text-sm leading-relaxed text-text-1">
            {t('docs.sources.disclaimerPre')}
            <span className="font-mono text-power">n/a</span>
            {t('docs.sources.disclaimerPost')}
          </p>
        </motion.div>

        {/* 收錄廠商徽章牆（stagger 0.03s fade-up，hover scale 1.08 spring） */}
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.08em] text-text-2">{t('docs.sources.vendorsLabel')}</div>
          <div className="flex flex-wrap gap-2">
            {VENDOR_KEYS.map((v, i) => {
              const isDelta = i === 0;
              const name = isDelta ? t(v) : v;
              return (
                <motion.span
                  key={v}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.03 }}
                  whileHover={{ scale: 1.08 }}
                  // spring 手感
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                    isDelta
                      ? 'border-green/60 bg-green/10 font-medium text-green'
                      : 'border-line bg-bg-2 text-text-1 hover:border-[rgba(34,211,238,0.4)]',
                  )}
                >
                  {name}
                  {isDelta && (
                    <span className="rounded-full bg-green/20 px-1.5 py-0.5 text-[10px] leading-none text-green">
                      {t('docs.sources.deltaBadge')}
                    </span>
                  )}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* 台達電子 InfraSuite 專段 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-xl border border-green/40 bg-green/5 p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5">
            <Leaf className="h-4 w-4 text-green" />
            <h3 className="text-base font-medium text-text-0">{t('docs.sources.delta.title')}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-1">
            {t('docs.sources.delta.bodyPre')}
            <a
              href={DELTA_PS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-green underline-offset-4 transition-colors hover:underline"
            >
              deltapowersolutions.com
            </a>
            {t('docs.sources.delta.bodyPost')}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DELTA_PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-bg-2 px-3.5 py-2.5"
              >
                <span className="font-mono text-xs text-text-0">{p.name}</span>
                <span className="text-right text-xs text-text-2">{t(p.specKey)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DocSection>
  );
}
