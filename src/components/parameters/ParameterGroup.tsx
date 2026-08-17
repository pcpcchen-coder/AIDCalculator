import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { ParamItem } from './types';
import { categoryMeta, isCustomCategory } from './types';
import ParameterRow from './ParameterRow';

interface ParameterGroupProps {
  category: string;
  params: ParamItem[];
  index: number;
  flashKey?: string | null;
  onUpdate: (key: string, value: number) => Promise<void>;
  onReset: (key: string) => Promise<void>;
  onRequestDelete: (param: ParamItem) => void;
  onCreateClick: () => void;
}

/** 每個分類一張群組卡（含空「自訂」群組的 empty 狀態） */
const ParameterGroup = forwardRef<HTMLElement, ParameterGroupProps>(function ParameterGroup(
  { category, params, index, flashKey, onUpdate, onReset, onRequestDelete, onCreateClick },
  ref,
) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  const empty = params.length === 0;

  return (
    <motion.section
      ref={ref}
      id={`param-group-${index}`}
      data-category={category}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: Math.min(index, 4) * 0.07 }}
      className="scroll-mt-6 overflow-hidden rounded-xl border border-line bg-bg-2"
    >
      <header className="flex items-center gap-3 border-b border-line bg-bg-1/60 px-4 py-3.5 md:px-5">
        <span className="rounded-lg border border-line bg-bg-2 p-2 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-text-0">{category}</h2>
            <span className="rounded-full border border-line bg-bg-2 px-2 py-0.5 font-mono text-[10px] text-text-1">
              {params.length}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-text-1">{meta.blurb}</p>
        </div>
      </header>

      {empty ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <img src="/empty-rack.svg" alt="" className="h-24 w-auto opacity-80" />
          <p className="text-sm text-text-1">
            {isCustomCategory(category) ? '尚無自訂參數' : '此分類尚無參數'}
          </p>
          {isCustomCategory(category) && (
            <button
              type="button"
              onClick={onCreateClick}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent transition-all hover:shadow-glow"
            >
              <Plus className="h-3.5 w-3.5" />
              新增自訂參數
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-line">
          {params.map((p) => (
            <ParameterRow
              key={p.key}
              param={p}
              flash={flashKey === p.key}
              onUpdate={onUpdate}
              onReset={onReset}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
});

export default ParameterGroup;
