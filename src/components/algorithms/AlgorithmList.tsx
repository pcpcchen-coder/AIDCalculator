import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tpl, useI18n } from '@/i18n';
import type { AlgoItem } from './types';
import { algoCategoryLabel, extractVariables, isCustomAlgoCategory, sortAlgoCategories } from './types';

interface AlgorithmListProps {
  algorithms: AlgoItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/** 左欄：搜尋＋分類篩選＋依分類分組的算法清單 */
export default function AlgorithmList({ algorithms, selectedKey, onSelect }: AlgorithmListProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(
    () => sortAlgoCategories([...new Set(algorithms.map((a) => a.category))]),
    [algorithms],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return algorithms.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      const vars = extractVariables(a.formula).join(' ').toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.key.toLowerCase().includes(q) ||
        (a.paperRef ?? '').toLowerCase().includes(q) ||
        (a.formulaDisplay ?? '').toLowerCase().includes(q) ||
        vars.includes(q)
      );
    });
  }, [algorithms, search, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, AlgoItem[]>();
    for (const a of filtered) {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    }
    return sortAlgoCategories([...map.keys()]).map((c) => ({ category: c, items: map.get(c)! }));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-3">
      {/* 搜尋＋篩選 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('algos.list.searchPlaceholder')}
          className="border-line bg-bg-1 pl-9 text-sm text-text-0 placeholder:text-text-2"
        />
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="border-line bg-bg-1 text-sm text-text-0">
          <SelectValue placeholder={t('common.all')} />
        </SelectTrigger>
        <SelectContent className="border-line bg-bg-1">
          <SelectItem value="all" className="text-text-0 focus:bg-bg-3 focus:text-text-0">
            {t('common.all')}
          </SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 清單 */}
      <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {grouped.map((g) => (
            <div key={g.category} className="mb-2">
              <div className="px-2 pb-1.5 pt-2 text-xs font-medium tracking-[0.08em] text-text-2">
                {algoCategoryLabel(t, g.category)}
                <span className="ml-1.5 font-mono text-[10px]">{tpl(t('algos.list.count'), { n: g.items.length })}</span>
              </div>
              {g.items.map((a, i) => {
                const selected = a.key === selectedKey;
                const custom = !a.isBuiltin || isCustomAlgoCategory(a.category);
                return (
                  <motion.button
                    key={a.key}
                    type="button"
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.03 }}
                    onClick={() => onSelect(a.key)}
                    className={cn(
                      'relative mb-1 flex w-full flex-col gap-1 rounded-lg p-3 text-left transition-colors duration-150',
                      selected ? 'bg-bg-2' : 'hover:bg-bg-2/60',
                      !a.enabled && 'opacity-55',
                    )}
                  >
                    {selected && (
                      <motion.span
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-1/2 h-8 w-[3px] origin-center -translate-y-1/2 rounded-full bg-accent"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      {a.isBuiltin ? (
                        <span className="shrink-0 rounded-md border border-accent/50 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                          {a.paperRef ?? t('algos.list.builtin')}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-md border border-violet/50 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-violet">
                          {t('algos.list.custom')}
                        </span>
                      )}
                      <span className="flex-1 truncate text-sm text-text-0">{a.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-text-2">v{a.version}</span>
                    </div>
                    {(a.formulaDisplay || a.formula) && (
                      <span className="truncate font-mono text-xs text-text-2">
                        {a.formulaDisplay || a.formula}
                      </span>
                    )}
                    {custom && !a.isBuiltin && (
                      <span className="sr-only">{t('params.cat.customAlgo')}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-text-2">{t('algos.list.empty')}</p>
        )}
      </div>
    </div>
  );
}
