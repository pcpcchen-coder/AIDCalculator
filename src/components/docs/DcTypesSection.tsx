import { motion } from 'framer-motion';
import { useI18n, tpl } from '@/i18n';
import DocSection from './DocSection';

interface DcType {
  key: string;
  img: string;
  /** 英文型別名（AI Training / AI Inference / Mixed AI / Cloud），各語言固定 */
  title: string;
  nameKey: string;
  descKey: string;
  /** 節點型別組成（kind 固定，note 走 i18n） */
  nodes: { kind: string; noteKey: string }[];
  /** Reference 系統示例徽章 */
  refs: string[];
}

const DC_TYPES: DcType[] = [
  {
    key: 'ai-training',
    img: '/dc-type-ai-training.jpg',
    title: 'AI Training',
    nameKey: 'docs.dcTypes.aiTraining.name',
    descKey: 'docs.dcTypes.aiTraining.desc',
    nodes: [{ kind: 'GPU', noteKey: 'docs.dcTypes.aiTraining.nodeGpu' }],
    refs: ['xAI COLOSSUS', 'DGX SuperPOD', 'El Capitan'],
  },
  {
    key: 'ai-inference',
    img: '/dc-type-ai-inference.jpg',
    title: 'AI Inference',
    nameKey: 'docs.dcTypes.aiInference.name',
    descKey: 'docs.dcTypes.aiInference.desc',
    nodes: [
      { kind: 'CPU-GPU', noteKey: 'docs.dcTypes.aiInference.nodeCpuGpu' },
      { kind: 'CPU', noteKey: 'docs.dcTypes.aiInference.nodeCpu' },
    ],
    refs: ['Microsoft GreenSKU'],
  },
  {
    key: 'mixed',
    img: '/dc-type-mixed.jpg',
    title: 'Mixed AI',
    nameKey: 'docs.dcTypes.mixed.name',
    descKey: 'docs.dcTypes.mixed.desc',
    nodes: [
      { kind: 'GPU', noteKey: 'docs.dcTypes.mixed.nodeGpu' },
      { kind: 'CPU-GPU', noteKey: 'docs.dcTypes.mixed.nodeCpuGpu' },
      { kind: 'CPU', noteKey: 'docs.dcTypes.mixed.nodeCpu' },
    ],
    refs: ['Frontier', 'Aurora'],
  },
  {
    key: 'cloud',
    img: '/dc-type-cloud.jpg',
    title: 'Cloud',
    nameKey: 'docs.dcTypes.cloud.name',
    descKey: 'docs.dcTypes.cloud.desc',
    nodes: [
      { kind: 'CPU', noteKey: 'docs.dcTypes.cloud.nodeCpu' },
      { kind: 'Storage', noteKey: 'docs.dcTypes.cloud.nodeStorage' },
    ],
    refs: ['Fugaku'],
  },
];

/** Section 4 — 四種資料中心類型（2×2 卡片，頂部 140px 圖帶） */
export default function DcTypesSection() {
  const { t } = useI18n();
  return (
    <DocSection id="dc-types" title={t('docs.dcTypes.title')}>
      <div className="grid gap-5 md:grid-cols-2">
        {DC_TYPES.map((dc, i) => (
          <motion.article
            key={dc.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: (i % 2) * 0.08 }}
            className="group flex flex-col overflow-hidden rounded-xl border border-line bg-bg-2 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
          >
            {/* 頂部 140px 圖帶：hover scale 1.05 600ms＋暗角加深 */}
            <div className="relative h-[140px] overflow-hidden">
              <img
                src={dc.img}
                alt={tpl(t('docs.dcTypes.alt'), { name: t(dc.nameKey) })}
                loading="lazy"
                className="h-full w-full object-cover transition-transform [transition-duration:600ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/20 to-transparent transition-opacity [transition-duration:600ms] group-hover:from-bg-2 group-hover:via-bg-0/40" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{dc.title}</div>
              <h3 className="mt-1.5 text-base font-medium text-text-0">{t(dc.nameKey)}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-text-1">{t(dc.descKey)}</p>

              {/* 節點型別組成 */}
              <div className="mt-4">
                <div className="mb-2 text-xs text-text-2">{t('docs.dcTypes.nodesLabel')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {dc.nodes.map((n) => (
                    <span
                      key={n.kind}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-1 px-2.5 py-1 font-mono text-xs text-cool"
                    >
                      {n.kind}
                      <span className="font-sans text-[11px] text-text-2">{t(n.noteKey)}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reference 系統示例徽章（violet 邊） */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
                <span className="mr-1 text-[11px] text-text-2">{t('docs.dcTypes.refLabel')}</span>
                {dc.refs.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-violet/50 bg-violet/10 px-2.5 py-0.5 font-mono text-[11px] text-violet"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </DocSection>
  );
}
