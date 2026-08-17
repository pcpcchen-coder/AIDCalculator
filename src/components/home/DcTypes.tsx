import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useI18n, tpl } from '@/i18n';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface DcType {
  key: string;
  img: string;
  title: string;
  zh: string;
  desc: string;
  badges: string[];
}

function TypeCard({ item }: { item: DcType }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-bg-2 md:flex-row">
      <div className="relative h-48 md:h-auto md:w-[55%]">
        <img
          src={item.img}
          alt={tpl(t('home.types.imgAlt'), { type: item.zh })}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-2/90 via-transparent to-transparent md:bg-gradient-to-r" />
      </div>
      <div className="flex flex-1 flex-col justify-center p-6 md:w-[45%] md:p-10">
        <div className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{item.title}</div>
        <h3 className="mt-2 text-2xl font-bold text-text-0">{item.zh}</h3>
        <p className="mt-3 text-sm leading-relaxed text-text-1">{item.desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-line bg-bg-1 px-3 py-1 font-mono text-xs text-cool"
            >
              {b}
            </span>
          ))}
        </div>
        <Link
          to={`/generator?type=${item.key}`}
          className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
        >
          {t('home.types.cta')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DcTypes() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);

  const types: DcType[] = [
    {
      key: 'ai-training',
      img: '/dc-type-ai-training.jpg',
      title: 'AI Training',
      zh: t('home.types.aiTraining.zh'),
      desc: t('home.types.aiTraining.desc'),
      badges: [t('home.types.aiTraining.badge1'), '≥100 kW/rack'],
    },
    {
      key: 'ai-inference',
      img: '/dc-type-ai-inference.jpg',
      title: 'AI Inference',
      zh: t('home.types.aiInference.zh'),
      desc: t('home.types.aiInference.desc'),
      badges: [t('home.types.aiInference.badge1'), '20–60 kW/rack'],
    },
    {
      key: 'mixed',
      img: '/dc-type-mixed.jpg',
      title: 'Mixed AI Training & Inference',
      zh: t('home.types.mixed.zh'),
      desc: t('home.types.mixed.desc'),
      badges: [t('home.types.mixed.badge1'), t('home.types.mixed.badge2')],
    },
    {
      key: 'cloud',
      img: '/dc-type-cloud.jpg',
      title: 'Cloud',
      zh: t('home.types.cloud.zh'),
      desc: t('home.types.cloud.desc'),
      badges: [t('home.types.cloud.badge1'), t('home.types.cloud.badge2')],
    },
  ];

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
          <h2 className="text-xl font-bold text-text-0 md:text-2xl">{t('home.types.title')}</h2>
        </div>
        <p className="mt-2 pl-[15px] text-sm text-text-1">
          {t('home.types.subtitle')}
        </p>
      </div>

      {/* 桌面：pin 舞台；行動版：垂直列 */}
      <div className="dc-types-stage relative hidden h-[70vh] lg:block">
        {types.map((item, i) => (
          <div key={item.key} className="dc-type-card absolute inset-0" style={{ zIndex: i + 1 }}>
            <TypeCard item={item} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6 lg:hidden">
        {types.map((item) => (
          <div key={item.key} className="dc-type-card">
            <TypeCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
