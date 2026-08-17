import { motion } from 'framer-motion';
import { AlertTriangle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import DocSection from './DocSection';
import { DELTA_PS_URL } from './docs-data';

const VENDORS = [
  '台達電子 Delta',
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
  { name: 'Modulon DPH Gen3', spec: 'SiC 架構，效率達 97.5%' },
  { name: 'Ultron DPS / DPM', spec: '三相 UPS 系列' },
  { name: 'GoCool L2L CDU', spec: '液對液 660 kW–3 MW' },
  { name: 'In-Rack CDU', spec: '機櫃級液冷分配' },
  { name: 'rPDU ViLink', spec: '智慧型機架 PDU' },
];

/** Section 9 — 資料來源：聲明卡＋廠商徽章牆＋台達專段 */
export default function SourcesSection() {
  return (
    <DocSection id="sources" title="資料來源">
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
            設備規格取自各製造商公開型錄、官方規格頁與新聞稿，每筆資料附來源
            URL；查無資料之欄位標記 <span className="font-mono text-power">n/a</span>
            ，不做推測填值。規格僅供學術研究與模型演示，實際工程設計請以原廠最新公告為準。
          </p>
        </motion.div>

        {/* 收錄廠商徽章牆（stagger 0.03s fade-up，hover scale 1.08 spring） */}
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.08em] text-text-2">收錄廠商</div>
          <div className="flex flex-wrap gap-2">
            {VENDORS.map((v, i) => {
              const isDelta = i === 0;
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
                  {v}
                  {isDelta && (
                    <span className="rounded-full bg-green/20 px-1.5 py-0.5 text-[10px] leading-none text-green">
                      重點收錄
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
            <h3 className="text-base font-medium text-text-0">台達電子 InfraSuite 產品專段</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-1">
            本平台依需求重點收錄台達電子 InfraSuite 產品線：Modulon DPH／DPH Gen3／Ultron 系列
            UPS 11 款、GoCool 液冷 CDU 11 款（含 L2L／L2A、In-Rack）、rPDU ViLink 與 InfraSuite
            PDC 配電 5 款。規格抄錄自{' '}
            <a
              href={DELTA_PS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-green underline-offset-4 transition-colors hover:underline"
            >
              deltapowersolutions.com
            </a>{' '}
            官方規格頁與型錄 PDF，僅供研究用途。
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DELTA_PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-bg-2 px-3.5 py-2.5"
              >
                <span className="font-mono text-xs text-text-0">{p.name}</span>
                <span className="text-right text-xs text-text-2">{p.spec}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DocSection>
  );
}
