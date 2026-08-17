import type { ReactNode } from 'react';

interface DocSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** 章節容器：H2（cyan 豎線裝飾）＋錨點 id＋捲動偏移 */
export default function DocSection({ id, title, children }: DocSectionProps) {
  return (
    <section id={id} data-doc-section className="scroll-mt-32">
      <h2 className="flex items-center gap-3 text-xl font-bold text-text-0 md:text-2xl">
        <span aria-hidden className="h-6 w-[3px] shrink-0 rounded-full bg-accent" />
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
