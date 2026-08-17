import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';
import ScrollDrawSvg from './ScrollDrawSvg';

interface PowerRole {
  role: string;
  roleKey: string;
  /** 型錄收錄示例（首項於 highlight 列以綠色標出） */
  exampleKeys: string[];
  highlight: boolean;
}

const POWER_ROLES: PowerRole[] = [
  {
    role: 'MSB',
    roleKey: 'docs.power.msb.role',
    exampleKeys: ['docs.power.msb.ex1', 'docs.power.msb.ex2'],
    highlight: false,
  },
  {
    role: 'UPS',
    roleKey: 'docs.power.ups.role',
    exampleKeys: ['docs.power.ups.ex1', 'docs.power.ups.ex2', 'docs.power.ups.ex3', 'docs.power.ups.ex4'],
    highlight: true,
  },
  {
    role: 'PDU',
    roleKey: 'docs.power.pdu.role',
    exampleKeys: ['docs.power.pdu.ex1', 'docs.power.pdu.ex2'],
    highlight: true,
  },
  {
    role: 'Backup Generator',
    roleKey: 'docs.power.generator.role',
    exampleKeys: [
      'docs.power.generator.ex1',
      'docs.power.generator.ex2',
      'docs.power.generator.ex3',
      'docs.power.generator.ex4',
    ],
    highlight: false,
  },
];

/** Section 6 — 配電鏈：滾動描邊 SVG＋設備角色表＋損耗說明卡 */
export default function PowerSection() {
  const { t } = useI18n();
  const sep = t('docs.power.examplesSep');
  return (
    <DocSection id="power" title={t('docs.power.title')}>
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          {t('docs.power.body')}
        </p>

        {/* 全寬 power-chain.svg：滾動進度描邊繪出 */}
        <ScrollDrawSvg src="/power-chain.svg" label={t('docs.power.svgLabel')} />

        {/* 設備角色小表（列 stagger 0.05s） */}
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-bg-1 text-xs uppercase tracking-[0.08em] text-text-1">
                <th className="px-4 py-3 font-medium">{t('docs.power.th.level')}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{t('docs.power.th.role')}</th>
                <th className="px-4 py-3 font-medium">{t('docs.power.th.examples')}</th>
              </tr>
            </thead>
            <tbody>
              {POWER_ROLES.map((row, i) => {
                const examples = row.exampleKeys.map((k) => t(k));
                return (
                  <motion.tr
                    key={row.role}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.05 }}
                    className="border-t border-line bg-bg-2 transition-colors duration-150 hover:bg-bg-3"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-violet md:text-sm">{row.role}</td>
                    <td className="hidden px-4 py-3.5 text-text-1 md:table-cell">{t(row.roleKey)}</td>
                    <td className="px-4 py-3.5 leading-relaxed text-text-1">
                      {row.highlight ? (
                        <span>
                          <span className="text-green">{examples[0]}</span>
                          {examples.length > 1 && `${sep}${examples.slice(1).join(sep)}`}
                        </span>
                      ) : (
                        examples.join(sep)
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 轉換損耗說明卡（式 18–19） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex gap-3 rounded-xl border border-violet/40 bg-violet/5 p-5"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
          <p className="text-sm leading-relaxed text-text-1">
            <strong className="text-text-0">{t('docs.power.loss.title')}</strong>
            {t('docs.power.loss.body')}
          </p>
        </motion.div>
      </div>
    </DocSection>
  );
}
