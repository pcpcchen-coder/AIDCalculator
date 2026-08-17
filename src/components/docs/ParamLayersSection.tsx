import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Database, Keyboard, LineChart } from 'lucide-react';
import DocSection from './DocSection';

const LAYERS = [
  {
    icon: Keyboard,
    title: '使用者輸入',
    desc: '產生器表單：DC 類型、規模（機架數／功率目標）、年份、冗餘模式、安全餘裕、優化目標。',
    bullets: ['AI 訓練 / 推論 / 混合 / 雲端', '2024 / 2027 / 2029', 'N / N+1 / N+2 / 2N / xN-y'],
    link: { to: '/generator', label: '前往配置產生器' },
  },
  {
    icon: Database,
    title: '內部參數',
    desc: '參數管理中的全域常數：安全餘裕、儲存功率占比 4.2%、IOPS 換算 404、走道比例 2/3、機櫃高度 42U 等。',
    bullets: ['安全餘裕（safety margin）', '4.2% · 404 · 2/3 · 42U', '全部入庫、可調可擴充'],
    link: { to: '/parameters', label: '前往參數管理' },
  },
  {
    icon: LineChart,
    title: '輸出',
    desc: '演算結果：空間與功率指標、White / Gray space 面積、分層設備 BOM；每次演算皆記錄輸入與參數快照。',
    bullets: ['IT 機架分佈 / 功率密度', 'White / Gray space', '設備 BOM（對應設備型錄）'],
    link: { to: '/catalog', label: '前往設備型錄' },
  },
];

/** Section 8 — 參數三層架構（使用者輸入 → 內部參數 → 輸出） */
export default function ParamLayersSection() {
  return (
    <DocSection id="param-layers" title="參數三層架構">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {LAYERS.map((layer, i) => (
            <div key={layer.title} className="flex flex-1 flex-col items-center gap-3 md:flex-row">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.1 }}
                className="flex w-full flex-1 flex-col rounded-xl border border-line bg-bg-2 p-5 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
              >
                <div className="flex items-center gap-2.5">
                  <layer.icon className="h-4 w-4 text-accent" />
                  <h3 className="text-base font-medium text-text-0">{layer.title}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-text-1">{layer.desc}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {layer.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 font-mono text-xs text-text-2">
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to={layer.link.to}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
                >
                  {layer.link.label}
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
          三層全部入庫：使用者輸入、當下生效的內部參數，以及演算輸出會一併保存為
          <strong className="text-text-0">情境快照（scenario snapshot）</strong>
          ，確保任何一次產生的配置都可回溯、可重現。算法本體則可於「算法管理」檢視公式並試算。
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            to="/parameters"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
          >
            前往參數管理
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/algorithms"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
          >
            前往算法管理
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </DocSection>
  );
}
