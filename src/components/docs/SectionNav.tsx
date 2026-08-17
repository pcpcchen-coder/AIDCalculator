import { cn } from '@/lib/utils';
import type { DocSectionMeta } from './docs-data';

interface SectionNavProps {
  sections: DocSectionMeta[];
  activeId: string;
  onNavigate: (id: string) => void;
}

/**
 * 章節錨點導覽（scroll-spy）。
 * 桌面：左側 200px sticky 直列；行動版：頂部 sticky 橫滑膠囊列。
 */
export default function SectionNav({ sections, activeId, onNavigate }: SectionNavProps) {
  return (
    <>
      {/* 桌面版：sticky 直列 */}
      <nav aria-label="章節導覽" className="sticky top-8 hidden w-[200px] shrink-0 self-start lg:block">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-text-2">目錄</div>
        <ul className="flex flex-col gap-1">
          {sections.map((s) => {
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(s.id)}
                  className={cn(
                    'relative flex w-full items-center rounded-md py-1.5 pl-4 pr-2 text-left text-sm transition-colors duration-150',
                    active ? 'text-text-0' : 'text-text-2 hover:text-text-1',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-opacity',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 行動版：頂部 sticky 橫滑膠囊列 */}
      <nav
        aria-label="章節導覽"
        className="no-scrollbar sticky top-[57px] z-30 -mx-4 flex gap-2 overflow-x-auto border-b border-line bg-bg-0/90 px-4 py-2.5 backdrop-blur lg:hidden"
      >
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate(s.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors duration-150',
                active
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-line bg-bg-2 text-text-2 hover:text-text-1',
              )}
            >
              {s.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
