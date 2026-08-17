import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Cpu,
  Snowflake,
  PlugZap,
  PackageCheck,
  ArrowRight,
  SlidersHorizontal,
  FunctionSquare,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';

const FLOW_STEPS = [
  { icon: ClipboardList, labelKey: 'docs.overview.flow.itDemand.label', subKey: 'docs.overview.flow.itDemand.sub' },
  { icon: Cpu, labelKey: 'docs.overview.flow.itPower.label', subKey: 'docs.overview.flow.itPower.sub' },
  { icon: Snowflake, labelKey: 'docs.overview.flow.cooling.label', subKey: 'docs.overview.flow.cooling.sub' },
  { icon: PlugZap, labelKey: 'docs.overview.flow.power.label', subKey: 'docs.overview.flow.power.sub' },
  { icon: PackageCheck, labelKey: 'docs.overview.flow.bom.label', subKey: 'docs.overview.flow.bom.sub' },
];

const INPUT_KEYS = [
  'docs.overview.inputs.rackOrPower',
  'docs.overview.inputs.dcType',
  'docs.overview.inputs.year',
  'docs.overview.inputs.redundancy',
  'docs.overview.inputs.margin',
  'docs.overview.inputs.objective',
];
const OUTPUT_KEYS = [
  'docs.overview.outputs.rackDist',
  'docs.overview.outputs.powerDensity',
  'docs.overview.outputs.whiteGray',
  'docs.overview.outputs.bom',
];

function FlowArrow({ delay }: { delay: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 12"
      className="h-3 w-10 shrink-0 text-accent md:w-12"
      fill="none"
    >
      <motion.path
        d="M0 6 H40"
        stroke="currentColor"
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay }}
      />
      <motion.path
        d="M36 1.5 L44 6 L36 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: delay + 0.3 }}
      />
    </svg>
  );
}

/** Section 3 — 模型概覽：輸入→輸出說明＋五步橫向流程圖＋提示卡 */
export default function OverviewSection() {
  const { t } = useI18n();
  return (
    <DocSection id="overview" title={t('docs.overview.title')}>
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          {t('docs.overview.bodyPre')}
          <strong className="text-text-0">{t('docs.overview.bodyEm')}</strong>
          {t('docs.overview.bodyPost')}
        </p>

        {/* 輸入 / 輸出對照 */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-xl border border-line bg-bg-2 p-5"
          >
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{t('docs.overview.inputs.title')}</div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-1">
              {INPUT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
            className="rounded-xl border border-line bg-bg-2 p-5"
          >
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-green">{t('docs.overview.outputs.title')}</div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-1">
              {OUTPUT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-green" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* 五步橫向流程圖：節點 stagger 0.12s scale .8→1 fade，箭頭依序畫出 */}
        <div className="flex flex-wrap items-center justify-center gap-y-4 rounded-xl border border-line bg-bg-1 px-4 py-6 md:flex-nowrap md:justify-between md:px-6">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.labelKey} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.12 }}
                className="flex w-[104px] flex-col items-center gap-2 rounded-lg border border-line bg-bg-2 px-3 py-4 text-center"
              >
                <step.icon className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-text-0">{t(step.labelKey)}</span>
                <span className="font-mono text-[11px] text-text-2">{t(step.subKey)}</span>
              </motion.div>
              {i < FLOW_STEPS.length - 1 && <FlowArrow delay={0.2 + i * 0.12} />}
            </div>
          ))}
        </div>

        {/* 提示卡（cyan 邊） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-xl border border-accent/40 bg-accent/5 p-5"
        >
          <p className="text-sm leading-relaxed text-text-1">
            {t('docs.overview.tip.body')}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              to="/parameters"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t('docs.common.goParameters')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/algorithms"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              <FunctionSquare className="h-3.5 w-3.5" />
              {t('docs.common.goAlgorithms')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </DocSection>
  );
}
