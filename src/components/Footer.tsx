import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-1">
      <motion.div
        className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-3 md:px-8 md:py-14"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <img src="/logo.svg" alt="DCGen Web Logo" className="h-8 w-8" />
            <span className="font-display text-base font-bold text-text-0">
              DCGen <span className="text-accent">Web</span>
            </span>
          </div>
          <p className="text-sm text-text-1">
            基於 DCGen 1.1 模型的資料中心配置產生平台：輸入 IT 需求，即時產出機房空間、功率、冷卻與配電設備清單。
          </p>
          <p className="mt-3 font-mono text-xs text-text-2">
            引用格式：DCGen 1.1, UChicago / Argonne, arXiv:2604.09616
          </p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
            資料來源聲明
          </h3>
          <p className="text-sm text-text-1">
            本平台設備規格取自各製造商公開型錄與官方網站（含台達電子、Vertiv、Schneider
            Electric、Evapco、Carrier、Cummins 等），僅供學術研究與模型演示，數值以原廠最新公告為準。
          </p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
            相關連結
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-text-1">
            <li>
              <a
                href="https://arxiv.org/abs/2604.09616"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                arXiv:2604.09616 論文
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/WedanEmmanuel/DCGen"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                DCGen 開源 REPO
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a
                href="https://www.deltaww.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                台達電子官方網站
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          </ul>
        </motion.div>
      </motion.div>
      <div className="border-t border-line py-4 text-center font-mono text-xs text-text-2">
        © 2026 DCGen Web · 基於 DCGen 1.1 (UChicago / Argonne)
      </div>
    </footer>
  );
}
