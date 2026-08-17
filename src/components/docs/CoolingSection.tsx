import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Snowflake, Droplets, Waves } from 'lucide-react';
import DocSection from './DocSection';
import ScrollDrawSvg from './ScrollDrawSvg';

const COOLING_PATHS = [
  {
    icon: Snowflake,
    title: 'Dry cooling',
    desc: '以乾冷卻器將冷卻液熱量直接排至大氣，不耗水、維護簡單，適合缺水或水價高的場址；對應型錄 Dry coolers 類（Kelvion、LU-VE 等）。',
    link: '/catalog?category=dry_cooler',
  },
  {
    icon: Droplets,
    title: 'Evaporative cooling',
    desc: '以冷卻水塔蒸發散熱，效率高、可負荷更大熱量，但需耗水並處理水質；對應型錄 Cooling towers 類（Evapco、BAC、SPX Marley）。',
    link: '/catalog?category=cooling_tower',
  },
  {
    icon: Waves,
    title: '液冷 CDU',
    desc: '列級／機櫃級 CDU 將冷卻液分配至高密度機架。型錄收錄台達 GoCool 系列 150–3000 kW、CoolIT CHx2000、Motivair MCDU-70 等市售機型。',
    link: '/catalog?category=cdu',
  },
];

/** Section 5 — 冷卻鏈：滾動描邊 SVG＋三欄短文 */
export default function CoolingSection() {
  return (
    <DocSection id="cooling" title="冷卻鏈">
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          IT 負載的每一分瓦特最終都成為熱。DCGen 依熱負載沿「機架 → CDU →
          乾冷卻器／冷卻水塔 → 冰水機」的迴路逐級選型（式 9–13），並將冷卻系統自身的耗電回授至配電鏈。
        </p>

        {/* 全寬 cooling-loop.svg：滾動進度描邊繪出 */}
        <ScrollDrawSvg src="/cooling-loop.svg" label="冷卻迴路示意：IT 機架 → CDU → 乾冷卻器／冷卻水塔 → 冰水機" />

        <div className="grid gap-4 md:grid-cols-3">
          {COOLING_PATHS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
              className="flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
            >
              <c.icon className="h-5 w-5 text-cool" />
              <h3 className="mt-3 font-mono text-sm font-medium text-text-0">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-1">{c.desc}</p>
              <Link
                to={c.link}
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
              >
                檢視型錄
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DocSection>
  );
}
