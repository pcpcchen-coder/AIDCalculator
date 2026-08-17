import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Info } from 'lucide-react';
import { useI18n } from '@/i18n';

const STEP_KEYS = ['params.flow.step1', 'params.flow.step2', 'params.flow.step3'];

/** Section 4 — 參數如何被使用（說明卡） */
export default function ParamFlowCard() {
  const { t } = useI18n();
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-line bg-bg-1 p-5 md:p-6"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="rounded-lg border border-line bg-bg-2 p-2 text-accent">
          <Info className="h-4 w-4" />
        </span>
        <h2 className="text-base font-medium text-text-0">{t('params.flow.title')}</h2>
      </div>

      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {STEP_KEYS.map((stepKey, i) => (
          <div key={stepKey} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
            <div className="flex-1 rounded-lg border border-line bg-bg-2 px-3 py-2.5 text-center text-xs text-text-1 md:text-left">
              {t(stepKey)}
            </div>
            {i < STEP_KEYS.length - 1 && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-accent"
              >
                <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
              </motion.span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-text-2">
        {t('params.flow.note')}
        <Link to="/algorithms" className="ml-1 text-accent transition-colors hover:text-cool">
          {t('params.flow.link')}
        </Link>
      </p>
    </motion.section>
  );
}
