import { motion, AnimatePresence } from 'framer-motion';
import { REDUNDANCY_SLOTS } from '@contracts/dcgen';
import type { RedundancyMap, RedundancySlotKey } from '@contracts/dcgen';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import SegmentedControl from '@/components/generator/SegmentedControl';
import {
  REDUNDANCY_PRESETS,
  effectiveCapacityRatio,
  fmt,
  isPresetRedundancy,
  parseCustomRedundancy,
} from '@/components/generator/generator-utils';

interface RedundancyEditorProps {
  value: RedundancyMap;
  onChange: (next: RedundancyMap) => void;
}

const OPTIONS = [
  ...REDUNDANCY_PRESETS.map((p) => ({ value: p as string, label: p })),
  { value: '__custom__', label: 'xN/y' },
];

/** 七槽冗餘編輯器：N / N+1 / N+2 / 2N / 自訂 xN/y（generator.md §2.1 群組 C） */
export default function RedundancyEditor({ value, onChange }: RedundancyEditorProps) {
  const { t } = useI18n();
  const setSlot = (key: RedundancySlotKey, v: string) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-3">
      {REDUNDANCY_SLOTS.map((slot) => {
        const current = value[slot.key];
        const custom = !isPresetRedundancy(current);
        const segValue = custom ? '__custom__' : current;
        const parsed = parseCustomRedundancy(current) ?? { x: 2, y: 1 };
        const ratio = effectiveCapacityRatio(current);

        return (
          <div key={slot.key} className="rounded-lg border border-line/60 bg-bg-1/50 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-text-1">{slot.label}</span>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[11px]',
                  custom
                    ? 'border-violet/40 bg-violet/10 text-violet'
                    : 'border-accent/30 bg-accent/5 text-accent',
                )}
              >
                {current}
              </span>
            </div>
            <SegmentedControl
              id={`red-${slot.key}`}
              size="sm"
              value={segValue}
              onChange={(v) => {
                if (v === '__custom__') setSlot(slot.key, '2N/1');
                else setSlot(slot.key, v);
              }}
              options={OPTIONS}
            />
            <AnimatePresence initial={false}>
              {custom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-1">
                    <span className="font-mono">x=</span>
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={parsed.x}
                      onChange={(e) => {
                        const x = Math.max(1, Math.round(Number(e.target.value) || 1));
                        setSlot(slot.key, `${x}N/${parsed.y}`);
                      }}
                      className="h-7 w-14 rounded-md border border-line bg-bg-1 px-2 font-mono text-xs text-text-0 focus:border-accent focus:outline-none"
                    />
                    <span className="font-mono">y=</span>
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={parsed.y}
                      onChange={(e) => {
                        const y = Math.max(1, Math.round(Number(e.target.value) || 1));
                        setSlot(slot.key, `${parsed.x}N/${y}`);
                      }}
                      className="h-7 w-14 rounded-md border border-line bg-bg-1 px-2 font-mono text-xs text-text-0 focus:border-accent focus:outline-none"
                    />
                    {ratio != null && (
                      <span className="ml-auto font-mono text-[11px] text-cool">
                        {tpl(t('generator.redundancy.effective'), {
                          y: parsed.y,
                          x: parsed.x,
                          pct: fmt(ratio * 100, 1),
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
