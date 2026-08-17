import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';

const STEPS = [
  {
    no: '01',
    title: '輸入需求',
    desc: '類型、規模（機架數或 MW）、年份、冗餘與散熱模式',
  },
  {
    no: '02',
    title: '演算',
    desc: 'DCGen 式 1–19 即時運算，套用目前全域參數與型錄',
  },
  {
    no: '03',
    title: '取得 BOM',
    desc: '空間／功率指標卡＋冷卻配電設備清單，可存檔、比較、匯出',
  },
];

export default function Workflow() {
  return (
    <section className="border-y border-line bg-bg-1">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
        <SectionHeading title="三步完成一次配置" />
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.no}
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.15 }}
            >
              {/* 步驟間虛線連接（桌面版） */}
              {i < STEPS.length - 1 && (
                <motion.svg
                  className="absolute -right-6 top-8 hidden h-4 w-12 md:block"
                  viewBox="0 0 48 8"
                  fill="none"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.4, duration: 0.4 }}
                >
                  <motion.path
                    d="M0 4 H48"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.4, duration: 0.4, ease: 'easeOut' }}
                  />
                </motion.svg>
              )}
              <div className="bg-gradient-to-r from-accent to-transparent bg-clip-text font-display text-5xl font-bold text-transparent">
                {s.no}
              </div>
              <h3 className="mt-3 text-base font-medium text-text-0">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-1">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            to="/generator"
            className="group inline-flex animate-pulse-glow items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-bg-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
          >
            開始產生配置
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
