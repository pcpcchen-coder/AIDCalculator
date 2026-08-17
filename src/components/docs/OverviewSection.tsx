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
import DocSection from './DocSection';

const FLOW_STEPS = [
  { icon: ClipboardList, label: 'IT 需求', sub: '機架數 / 功率目標' },
  { icon: Cpu, label: 'IT 功率·空間', sub: '式 1–8' },
  { icon: Snowflake, label: '冷卻系統', sub: '式 9–13' },
  { icon: PlugZap, label: '配電系統', sub: '式 14–19' },
  { icon: PackageCheck, label: '配置 BOM', sub: 'White / Gray space' },
];

const INPUTS = ['機架數或功率目標', 'DC 類型（四種）', '年份 2024 / 2027 / 2029', '冗餘模式', '安全餘裕', '優化目標'];
const OUTPUTS = ['IT 機架分佈', '功率密度', 'White / Gray space', '設備 BOM'];

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
  return (
    <DocSection id="overview" title="模型概覽">
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          DCGen 是一套<strong className="text-text-0">模型驅動的資料中心配置產生器</strong>
          ：以 IT 需求為起點，先由 IT 模型（式 7–15）推導機架分佈與功率密度，再沿冷卻鏈（式
          9–13）完成冷卻選型、沿配電鏈（式 14–19）完成配電與冗餘規劃，最終以式 17c／19c 推導
          Gray space 面積，輸出完整的空間、功率與設備清單（BOM）。
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
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">輸入</div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-1">
              {INPUTS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {item}
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
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-green">輸出</div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-1">
              {OUTPUTS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-green" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* 五步橫向流程圖：節點 stagger 0.12s scale .8→1 fade，箭頭依序畫出 */}
        <div className="flex flex-wrap items-center justify-center gap-y-4 rounded-xl border border-line bg-bg-1 px-4 py-6 md:flex-nowrap md:justify-between md:px-6">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.12 }}
                className="flex w-[104px] flex-col items-center gap-2 rounded-lg border border-line bg-bg-2 px-3 py-4 text-center"
              >
                <step.icon className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-text-0">{step.label}</span>
                <span className="font-mono text-[11px] text-text-2">{step.sub}</span>
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
            本平台所有步驟的參數皆可於「參數管理」調整，算法可於「算法管理」檢視與擴充。
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              to="/parameters"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              前往參數管理
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/algorithms"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              <FunctionSquare className="h-3.5 w-3.5" />
              前往算法管理
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </DocSection>
  );
}
