import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GEOMETRY_SELECTOR = 'path, rect, circle, ellipse, line, polyline, polygon';

interface ScrollDrawSvgProps {
  /** public/ 下的 SVG 路徑，如 /cooling-loop.svg */
  src: string;
  label: string;
}

/**
 * 藍圖線稿 SVG：進入視口後以 stroke-dashoffset 依滾動進度描邊繪出
 * （ScrollTrigger scrub，區段約 150vh）。reduced-motion 時直接完整顯示。
 */
export default function ScrollDrawSvg({ src, label }: ScrollDrawSvgProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [markup, setMarkup] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !markup) return;
      const svg = root.querySelector('svg');
      if (!svg) return;

      // 響應式：移除固定寬高，保留 viewBox
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('class', 'h-auto w-full');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);

      // 收集可描邊元素：有 stroke、非 defs/marker 內部、未自帶 dasharray
      const targets = Array.from(svg.querySelectorAll<SVGGeometryElement>(GEOMETRY_SELECTOR)).filter(
        (el) => {
          if (el.closest('defs') || el.closest('marker')) return false;
          if (el.getAttribute('stroke-dasharray')) return false;
          const stroke = window.getComputedStyle(el).stroke;
          return stroke && stroke !== 'none';
        },
      );

      const lengths = targets.map((el) => {
        try {
          return el.getTotalLength();
        } catch {
          return 0;
        }
      });

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return; // 不降 dasharray，直接完整顯示

      targets.forEach((el, i) => {
        const len = lengths[i] || 1;
        el.style.strokeDasharray = `${len}`;
        el.style.strokeDashoffset = `${len}`;
      });

      gsap.to(targets, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: 0.04,
        scrollTrigger: {
          trigger: root,
          start: 'top 85%',
          end: '+=150%',
          scrub: 0.6,
        },
      });
    },
    { scope: rootRef, dependencies: [markup] },
  );

  if (failed) {
    // fetch 失敗的降級：以 <img> 靜態呈現
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-bg-1">
        <img src={src} alt={label} className="h-auto w-full" />
      </div>
    );
  }

  if (!markup) {
    return (
      <div ref={rootRef} className="overflow-hidden rounded-xl border border-line bg-bg-1">
        <div className="aspect-[2/1] w-full animate-pulse bg-bg-2" />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-xl border border-line bg-bg-1 [&>svg]:h-auto [&>svg]:w-full"
      // SVG 為站內 public/ 自有資產，內容可信
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
