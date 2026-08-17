import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import DocSection from './DocSection';
import ScrollDrawSvg from './ScrollDrawSvg';

const POWER_ROLES = [
  {
    role: 'MSB',
    zh: '主配電盤',
    examples: 'Schneider BlokSeT、ABB MNS',
    highlight: false,
  },
  {
    role: 'UPS',
    zh: '不斷電系統',
    examples: '台達 Modulon DPH 500–2000 kVA（效率 96.5–97.5%）、Schneider Galaxy VL、Eaton 9395P、Huawei UPS5000-H',
    highlight: true,
  },
  {
    role: 'PDU',
    zh: '機架配電',
    examples: '台達 rPDU ViLink、APC NetShelter',
    highlight: true,
  },
  {
    role: 'Backup Generator',
    zh: '備援發電機',
    examples: 'Caterpillar、Cummins、Kohler、mtu',
    highlight: false,
  },
];

/** Section 6 — 配電鏈：滾動描邊 SVG＋設備角色表＋損耗說明卡 */
export default function PowerSection() {
  return (
    <DocSection id="power" title="配電鏈">
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          配電鏈自市電端逐級向下：MSB → 備援發電機 → UPS → PDU → 機架。DCGen
          以每一級的額定容量與冗餘模式（式 14–19）選定設備台數，確保任一層級都能承載 IT
          與冷卻的合計負載。
        </p>

        {/* 全寬 power-chain.svg：滾動進度描邊繪出 */}
        <ScrollDrawSvg src="/power-chain.svg" label="配電鏈示意：市電 → MSB → 備援發電機 → UPS → PDU → 機架" />

        {/* 設備角色小表（列 stagger 0.05s） */}
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-bg-1 text-xs uppercase tracking-[0.08em] text-text-1">
                <th className="px-4 py-3 font-medium">層級</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">角色</th>
                <th className="px-4 py-3 font-medium">型錄收錄示例</th>
              </tr>
            </thead>
            <tbody>
              {POWER_ROLES.map((row, i) => (
                <motion.tr
                  key={row.role}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.05 }}
                  className="border-t border-line bg-bg-2 transition-colors duration-150 hover:bg-bg-3"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-violet md:text-sm">{row.role}</td>
                  <td className="hidden px-4 py-3.5 text-text-1 md:table-cell">{row.zh}</td>
                  <td className="px-4 py-3.5 leading-relaxed text-text-1">
                    {row.highlight ? (
                      <span>
                        <span className="text-green">{row.examples.split('、')[0]}</span>
                        {row.examples.includes('、') && `、${row.examples.split('、').slice(1).join('、')}`}
                      </span>
                    ) : (
                      row.examples
                    )}
                  </td>
                </motion.tr>
              ))}
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
            <strong className="text-text-0">轉換損耗的計入方式（式 18–19）：</strong>
            各級設備效率連乘後得到鏈路總效率，與 IT
            功率的差額即為轉換損耗；此損耗同樣轉化為熱，會回授至冷卻鏈的熱負載計算，形成
            IT → 配電 → 冷卻的耦合迭代。
          </p>
        </motion.div>
      </div>
    </DocSection>
  );
}
