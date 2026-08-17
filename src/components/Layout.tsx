import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';

/**
 * App Shell：左側固定側欄（lg 以上）＋頂列抽屜（行動版）＋主內容區。
 * 內容 slot 採 {children} 模式 —— App.tsx 必須以
 * `<Layout><Routes>…</Routes></Layout>` 結構使用，不可混用 <Outlet/>。
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  // Lenis 全站平滑滾動（lerp 0.1）
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // 換頁時回到頂部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-bg-0 text-text-0">
      <Navbar />
      {/* 桌面版主內容右移 240px；行動版滿寬（頂列在文件流內） */}
      <div className="lg:pl-60">
        <main className="min-h-[100dvh]">{children}</main>
      </div>
    </div>
  );
}
