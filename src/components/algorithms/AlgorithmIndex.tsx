import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { tpl, useI18n } from '@/i18n';
import type { AlgoItem } from './types';
import { algoCategoryLabel, isCustomAlgoCategory, sortAlgoCategories } from './types';

interface AlgorithmIndexProps {
  algorithms: AlgoItem[];
  onSelect: (key: string) => void;
}

/** Section 4 — 內建算法速覽表（頁底三欄網格索引） */
export default function AlgorithmIndex({ algorithms, onSelect }: AlgorithmIndexProps) {
  const { t } = useI18n();
  const grouped = useMemo(() => {
    const map = new Map<string, AlgoItem[]>();
    for (const a of algorithms) {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    }
    return sortAlgoCategories([...map.keys()]).map((c) => ({ category: c, items: map.get(c)! }));
  }, [algorithms]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-12"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="h-5 w-[3px] rounded-full bg-accent" />
        <div>
          <h2 className="text-xl font-bold text-text-0 md:text-2xl">{t('algos.index.title')}</h2>
          <p className="mt-1 text-sm text-text-1">
            {t('algos.index.desc')}
          </p>
        </div>
      </div>

      {grouped.map((g) => (
        <div key={g.category} className="mb-6">
          <div className="mb-2.5 text-xs font-medium tracking-[0.08em] text-text-2">
            {algoCategoryLabel(t, g.category)}
            <span className="ml-1.5 font-mono text-[10px]">{tpl(t('algos.list.count'), { n: g.items.length })}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((a, i) => (
              <motion.button
                key={a.key}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(i, 6) * 0.04 }}
                onClick={() => onSelect(a.key)}
                className="group flex flex-col gap-1.5 rounded-xl border border-line bg-bg-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(34,211,238,0.4)]"
              >
                <div className="flex items-center gap-2">
                  {a.isBuiltin ? (
                    <span className="rounded-md border border-accent/50 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {a.paperRef ?? t('algos.list.builtin')}
                    </span>
                  ) : (
                    <span className="rounded-md border border-violet/50 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-violet">
                      {t('algos.list.custom')}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm font-medium text-text-0">{a.name}</span>
                  {!a.enabled && <span className="text-[10px] text-text-2">{t('algos.index.disabled')}</span>}
                </div>
                {(a.formulaDisplay || a.formula) && (
                  <span className="truncate font-mono text-xs text-text-2">
                    {a.formulaDisplay || a.formula}
                  </span>
                )}
                {isCustomAlgoCategory(a.category) && !a.isBuiltin && (
                  <span className="font-mono text-[10px] text-text-2">{a.key}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.section>
  );
}
