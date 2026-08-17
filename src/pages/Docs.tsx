import { useCallback, useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import DocsHero from '@/components/docs/DocsHero';
import SectionNav from '@/components/docs/SectionNav';
import OverviewSection from '@/components/docs/OverviewSection';
import DcTypesSection from '@/components/docs/DcTypesSection';
import CoolingSection from '@/components/docs/CoolingSection';
import PowerSection from '@/components/docs/PowerSection';
import RedundancySection from '@/components/docs/RedundancySection';
import ParamLayersSection from '@/components/docs/ParamLayersSection';
import SourcesSection from '@/components/docs/SourcesSection';
import CitationSection from '@/components/docs/CitationSection';
import { DOC_SECTIONS } from '@/components/docs/docs-data';

export default function Docs() {
  const [activeId, setActiveId] = useState(DOC_SECTIONS[0].id);
  const scrollRafRef = useRef(0);

  // Scroll-spy：章節進入視口上段時更新目前章節
  useEffect(() => {
    const sections = DOC_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 自訂平滑捲動（與 Lenis 相容：逐幀 window.scrollTo 會被 Lenis 同步採用）
  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    cancelAnimationFrame(scrollRafRef.current);
    const target = el.getBoundingClientRect().top + window.scrollY - 96;
    const start = window.scrollY;
    const diff = target - start;
    if (Math.abs(diff) < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      window.scrollTo(0, target);
      return;
    }
    const duration = 500;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      window.scrollTo(0, start + diff * eased);
      if (p < 1) scrollRafRef.current = requestAnimationFrame(step);
    };
    scrollRafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => cancelAnimationFrame(scrollRafRef.current), []);

  return (
    <div className="bg-bg-0">
      <DocsHero />

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex gap-10 py-10 md:py-16">
          <SectionNav sections={DOC_SECTIONS} activeId={activeId} onNavigate={handleNavigate} />

          {/* 右側內容 max-w 760px，章節間 64px */}
          <div className="flex w-full max-w-[760px] flex-col gap-16">
            <OverviewSection />
            <DcTypesSection />
            <CoolingSection />
            <PowerSection />
            <RedundancySection />
            <ParamLayersSection />
            <SourcesSection />
            <CitationSection />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
