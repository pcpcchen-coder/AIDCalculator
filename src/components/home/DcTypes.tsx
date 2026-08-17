import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TYPES = [
  {
    key: 'ai-training',
    img: '/dc-type-ai-training.jpg',
    title: 'AI Training',
    zh: 'AI 訓練',
    desc: '高密度 GPU 叢集、液冷為主。Canonical AI Training 配置以 NVL 系統機架（RackTDP 120+ kW）組成，追求極致功率密度。',
    badges: ['液冷', '≥100 kW/rack'],
  },
  {
    key: 'ai-inference',
    img: '/dc-type-ai-inference.jpg',
    title: 'AI Inference',
    zh: 'AI 推論',
    desc: '推論節點密度較低、分散部署，氣冷與液冷混合，強調 PUE 與彈性擴充。',
    badges: ['混合冷卻', '20–60 kW/rack'],
  },
  {
    key: 'mixed',
    img: '/dc-type-mixed.jpg',
    title: 'Mixed AI Training & Inference',
    zh: '混合訓練與推論',
    desc: '同一園區混合部署訓練與推論機房，模型依比例拆分 IT 負載再各自計算冷卻與配電。',
    badges: ['雙工作負載', '彈性配比'],
  },
  {
    key: 'cloud',
    img: '/dc-type-cloud.jpg',
    title: 'Cloud',
    zh: '雲端',
    desc: '傳統雲端機房：通用運算＋儲存節點，儲存功率占比（預設 4.2%）與 IOPS/TFLOPS 換算（預設 404）由此類配置校準。',
    badges: ['氣冷', '通用機架'],
  },
];

function TypeCard({ t }: { t: (typeof TYPES)[number] }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-bg-2 md:flex-row">
      <div className="relative h-48 md:h-auto md:w-[55%]">
        <img src={t.img} alt={`${t.zh}資料中心`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-2/90 via-transparent to-transparent md:bg-gradient-to-r" />
      </div>
      <div className="flex flex-1 flex-col justify-center p-6 md:w-[45%] md:p-10">
        <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{t.title}</div>
        <h3 className="mt-2 text-2xl font-bold text-text-0">{t.zh}</h3>
        <p className="mt-3 text-sm leading-relaxed text-text-1">{t.desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {t.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-line bg-bg-1 px-3 py-1 font-mono text-xs text-cool"
            >
              {b}
            </span>
          ))}
        </div>
        <Link
          to={`/generator?type=${t.key}`}
          className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
        >
          以此類型產生配置
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DcTypes() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 桌面版：pin 區，四卡依序從右側滑入堆疊
      mm.add('(min-width: 1024px)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.dc-type-card');
        gsap.set(cards, { xPercent: 100, opacity: 0 });
        gsap.set(cards[0], { xPercent: 0, opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.dc-types-stage',
            start: 'top top+=80',
            end: '+=250%',
            pin: true,
            scrub: 0.6,
          },
        });
        for (let i = 1; i < cards.length; i++) {
          tl.to(
            cards.slice(0, i),
            { scale: (idx) => 1 - 0.06 * (i - idx), filter: 'brightness(0.6)', duration: 1 },
            i,
          ).to(cards[i], { xPercent: 0, opacity: 1, duration: 1, ease: 'power2.out' }, i);
        }
      });

      // 手機/平板：垂直卡片列，進場 fade-up
      mm.add('(max-width: 1023px)', () => {
        gsap.utils.toArray<HTMLElement>('.dc-type-card').forEach((card) => {
          gsap.from(card, {
            opacity: 0,
            y: 40,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 85%', once: true },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="block h-7 w-[3px] rounded-full bg-accent" />
          <h2 className="text-xl font-bold text-text-0 md:text-2xl">支援的資料中心類型</h2>
        </div>
        <p className="mt-2 pl-[15px] text-sm text-text-1">
          對應 DCGen Canonical 配置，2024／2027／2029 三個運轉年份
        </p>
      </div>

      {/* 桌面：pin 舞台；行動版：垂直列 */}
      <div className="dc-types-stage relative hidden h-[70vh] lg:block">
        {TYPES.map((t, i) => (
          <div key={t.key} className="dc-type-card absolute inset-0" style={{ zIndex: i + 1 }}>
            <TypeCard t={t} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6 lg:hidden">
        {TYPES.map((t) => (
          <div key={t.key} className="dc-type-card">
            <TypeCard t={t} />
          </div>
        ))}
      </div>
    </section>
  );
}
