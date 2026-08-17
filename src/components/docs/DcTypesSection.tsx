import { motion } from 'framer-motion';
import DocSection from './DocSection';

interface DcType {
  key: string;
  img: string;
  title: string;
  zh: string;
  desc: string;
  /** 節點型別組成（GPU / CPU-GPU / CPU / Storage） */
  nodes: { kind: string; note: string }[];
  /** Reference 系統示例徽章 */
  refs: string[];
}

const DC_TYPES: DcType[] = [
  {
    key: 'ai-training',
    img: '/dc-type-ai-training.jpg',
    title: 'AI Training',
    zh: 'AI 訓練',
    desc: 'GPU 訓練叢集以同步式負載長時間滿載運轉，功率密度極高，液冷為必然選項。Canonical 配置隨世代演進：2024／2027／2029 三個年份的機架 TDP 由約 40 kW 走向 120 kW 以上。',
    nodes: [{ kind: 'GPU', note: '全部機架' }],
    refs: ['xAI COLOSSUS', 'DGX SuperPOD', 'El Capitan'],
  },
  {
    key: 'ai-inference',
    img: '/dc-type-ai-inference.jpg',
    title: 'AI Inference',
    zh: 'AI 推論',
    desc: '推論負載密度較低、請求驅動且分散部署，機架功率遠低於訓練叢集，氣冷與液冷混合即可滿足，重視彈性擴充與 PUE。',
    nodes: [
      { kind: 'CPU-GPU', note: '主力' },
      { kind: 'CPU', note: '前處理／調度' },
    ],
    refs: ['Microsoft GreenSKU'],
  },
  {
    key: 'mixed',
    img: '/dc-type-mixed.jpg',
    title: 'Mixed AI',
    zh: '混合訓練／推論',
    desc: '同一園區混合部署訓練與推論機房。模型依使用者設定的訓練／推論比例拆分 IT 負載，兩側各自推導冷卻與配電後再合併為整體配置。',
    nodes: [
      { kind: 'GPU', note: '訓練側' },
      { kind: 'CPU-GPU', note: '推論側' },
      { kind: 'CPU', note: '通用' },
    ],
    refs: ['Frontier', 'Aurora'],
  },
  {
    key: 'cloud',
    img: '/dc-type-cloud.jpg',
    title: 'Cloud',
    zh: '雲端',
    desc: '通用運算＋儲存的傳統雲端機房。儲存容量以三式（式 1–3）估算，IOPS 與 TFLOPS 間以 404 換算，儲存功率占 IT 功率比例（預設 4.2%）即由此類配置校準而來。',
    nodes: [
      { kind: 'CPU', note: '運算' },
      { kind: 'Storage', note: '儲存' },
    ],
    refs: ['Fugaku'],
  },
];

/** Section 4 — 四種資料中心類型（2×2 卡片，頂部 140px 圖帶） */
export default function DcTypesSection() {
  return (
    <DocSection id="dc-types" title="四種資料中心類型">
      <div className="grid gap-5 md:grid-cols-2">
        {DC_TYPES.map((t, i) => (
          <motion.article
            key={t.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: (i % 2) * 0.08 }}
            className="group flex flex-col overflow-hidden rounded-xl border border-line bg-bg-2 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
          >
            {/* 頂部 140px 圖帶：hover scale 1.05 600ms＋暗角加深 */}
            <div className="relative h-[140px] overflow-hidden">
              <img
                src={t.img}
                alt={`${t.zh}資料中心概念圖`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform [transition-duration:600ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/20 to-transparent transition-opacity [transition-duration:600ms] group-hover:from-bg-2 group-hover:via-bg-0/40" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{t.title}</div>
              <h3 className="mt-1.5 text-base font-medium text-text-0">{t.zh}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-text-1">{t.desc}</p>

              {/* 節點型別組成 */}
              <div className="mt-4">
                <div className="mb-2 text-xs text-text-2">節點型別組成</div>
                <div className="flex flex-wrap gap-1.5">
                  {t.nodes.map((n) => (
                    <span
                      key={n.kind}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-1 px-2.5 py-1 font-mono text-xs text-cool"
                    >
                      {n.kind}
                      <span className="font-sans text-[11px] text-text-2">{n.note}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reference 系統示例徽章（violet 邊） */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
                <span className="mr-1 text-[11px] text-text-2">Reference：</span>
                {t.refs.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-violet/50 bg-violet/10 px-2.5 py-0.5 font-mono text-[11px] text-violet"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </DocSection>
  );
}
