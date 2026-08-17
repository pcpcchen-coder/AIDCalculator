import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Database, Keyboard, LineChart } from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';

const LAYERS = [
  {
    icon: Keyboard,
    titleKey: 'docs.paramLayers.input.title',
    descKey: 'docs.paramLayers.input.desc',
    bulletKeys: ['docs.paramLayers.input.b1', 'docs.paramLayers.input.b2', 'docs.paramLayers.input.b3'],
    link: { to: '/generator', labelKey: 'docs.common.goGenerator' },
  },
  {
    icon: Database,
    titleKey: 'docs.paramLayers.internal.title',
    descKey: 'docs.paramLayers.internal.desc',
    bulletKeys: ['docs.paramLayers.internal.b1', 'docs.paramLayers.internal.b2', 'docs.paramLayers.internal.b3'],
    link: { to: '/parameters', labelKey: 'docs.common.goParameters' },
  },
  {
    icon: LineChart,
    titleKey: 'docs.paramLayers.output.title',
    descKey: 'docs.paramLayers.output.desc',
    bulletKeys: ['docs.paramLayers.output.b1', 'docs.paramLayers.output.b2', 'docs.paramLayers.output.b3'],
    link: { to: '/catalog', labelKey: 'docs.common.goCatalog' },
  },
];

/** Section 8 — 參數三層架構（使用者輸入 → 內部參數 → 輸出） */
export default function ParamLayersSection() {
  const { t } = useI18n();
  return (
    <DocSection id="param-layers" title={t('docs.paramLayers.title')}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {LAYERS.map((layer, i) => (
            <div key={layer.titleKey} className="flex flex-1 flex-col items-center gap-3 md:flex-row">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.1 }}
                className="flex w-full flex-1 flex-col rounded-xl border border-line bg-bg-2 p-5 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
              >
                <div className="flex items-center gap-2.5">
                  <layer.icon className="h-4 w-4 text-accent" />
                  <h3 className="text-base font-medium text-text-0">{t(layer.titleKey)}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-text-1">{t(layer.descKey)}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {layer.bulletKeys.map((key) => (
                    <li key={key} className="flex items-center gap-2 font-mono text-xs text-text-2">
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <Link
                  to={layer.link.to}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
                >
                  {t(layer.link.labelKey)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
              {i < LAYERS.length - 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  className="shrink-0 text-accent"
                  aria-hidden
                >
                  <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
                </motion.span>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-text-1">
          {t('docs.paramLayers.notePre')}
          <strong className="text-text-0">{t('docs.paramLayers.noteEm')}</strong>
          {t('docs.paramLayers.notePost')}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            to="/parameters"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
          >
            {t('docs.common.goParameters')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/algorithms"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
          >
            {t('docs.common.goAlgorithms')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </DocSection>
  );
}
