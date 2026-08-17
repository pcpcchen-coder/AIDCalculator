import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Info } from 'lucide-react';

const STEPS = ['參數管理（此頁）', '配置產生器演算（式 1–19 即時取值）', '結果＋參數快照（可重現）'];

/** Section 4 — 參數如何被使用（說明卡） */
export default function ParamFlowCard() {
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
        <h2 className="text-base font-medium text-text-0">參數流向</h2>
      </div>

      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
            <div className="flex-1 rounded-lg border border-line bg-bg-2 px-3 py-2.5 text-center text-xs text-text-1 md:text-left">
              {step}
            </div>
            {i < STEPS.length - 1 && (
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
        每次產生配置時系統會記錄完整參數快照，之後調整參數不影響已存情境。
        <Link to="/algorithms" className="ml-1 text-accent transition-colors hover:text-cool">
          查看算法如何引用參數 →
        </Link>
      </p>
    </motion.section>
  );
}
