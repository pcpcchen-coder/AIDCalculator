import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Cpu, Database, SlidersHorizontal, FunctionSquare, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';

const CARDS = [
  {
    icon: Cpu,
    title: '配置產生',
    desc: '選類型、給規模、挑冗餘，一鍵產出空間／功率／設備 BOM，結果可存檔比較。',
    link: { to: '/generator', label: '前往產生器' },
  },
  {
    icon: Database,
    title: '資料庫管理',
    desc: 'IT 參考配置與 8 類非 IT 設備型錄完整 CRUD，規格取自市售產品官方型錄，台達電子全系列在列。',
    link: { to: '/catalog', label: '瀏覽型錄' },
  },
  {
    icon: SlidersHorizontal,
    title: '參數管理',
    desc: '安全餘裕、儲存功率占比、機架 U 數等全域參數即調即用，也可新增自訂參數。',
    link: { to: '/parameters', label: '調整參數' },
  },
  {
    icon: FunctionSquare,
    title: '算法管理',
    desc: '論文式 1–19 公式透明可查、參數可調；自訂算法以安全公式求值器即建即試算。',
    link: { to: '/algorithms', label: '管理算法' },
  },
];

export default function Capabilities() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
      <SectionHeading title="平台能力" aside="從需求到設備清單的完整工作流" />
      <div className="grid gap-5 md:grid-cols-2">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-xl border border-line bg-bg-2 p-6 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
          >
            {/* hover 頂部 2px cyan 漸層線 */}
            <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-3">
              <card.icon className="h-5 w-5 text-text-1 transition-all duration-200 group-hover:rotate-[8deg] group-hover:text-accent" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-0">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-1">{card.desc}</p>
            <Link
              to={card.link.to}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              {card.link.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
