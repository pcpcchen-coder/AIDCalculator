import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, History, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tpl, useI18n } from '@/i18n';
import type { AuditItem, ParamItem } from './types';
import { fmtNum, isModified } from './types';

const ACTION_STYLE: Record<string, { labelKey: string; className: string }> = {
  update: { labelKey: 'params.audit.action.update', className: 'border-accent/50 text-accent' },
  create: { labelKey: 'params.audit.action.create', className: 'border-green/50 text-green' },
  reset: { labelKey: 'params.audit.action.reset', className: 'border-power/50 text-power' },
  delete: { labelKey: 'params.audit.action.delete', className: 'border-red/50 text-red' },
};

function fmtTime(t: Date | string): string {
  const d = t instanceof Date ? t : new Date(t);
  if (Number.isNaN(d.getTime())) return String(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface AuditPanelProps {
  params: ParamItem[];
  audits: AuditItem[];
  onReset: (key: string) => Promise<void>;
}

/** 變更紀錄面板：未還原修改清單 ＋ 最近 50 筆 audits 時間軸 */
export default function AuditPanel({ params, audits, onReset }: AuditPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const modifiedParams = params.filter(isModified);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="overflow-hidden rounded-xl border border-line bg-bg-2"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-3 md:px-5"
      >
        <span className="rounded-lg border border-line bg-bg-1 p-2 text-accent">
          <History className="h-4 w-4" />
        </span>
        <span className="flex-1 text-base font-medium text-text-0">{t('params.audit.title')}</span>
        {modifiedParams.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-power/50 bg-power/10 px-2.5 py-0.5 text-xs text-power">
            <span className="h-1.5 w-1.5 rounded-full bg-power" />
            {tpl(t('params.audit.pendingCount'), { n: modifiedParams.length })}
          </span>
        )}
        <ChevronDown
          className={cn('h-4 w-4 text-text-2 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-4 md:px-5">
              {/* 本次工作階段未還原修改 */}
              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
                {t('params.audit.pending')}
              </h3>
              {modifiedParams.length === 0 ? (
                <p className="mb-4 text-sm text-text-2">{t('params.audit.noPending')}</p>
              ) : (
                <ul className="mb-4 flex flex-col gap-1.5">
                  {modifiedParams.map((p) => (
                    <li
                      key={p.key}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-bg-1 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-text-0">{p.key}</span>
                      <span className="font-mono text-xs text-text-2">
                        {fmtNum(p.value)} → {fmtNum(p.defaultValue)}
                      </span>
                      <button
                        type="button"
                        disabled={busyKey === p.key}
                        onClick={async () => {
                          setBusyKey(p.key);
                          try {
                            await onReset(p.key);
                          } finally {
                            setBusyKey(null);
                          }
                        }}
                        className="ml-auto flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-1 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('params.audit.reset')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* 最近 50 筆 audits */}
              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
                {tpl(t('params.audit.recent'), { n: audits.length })}
              </h3>
              {audits.length === 0 ? (
                <p className="text-sm text-text-2">{t('params.audit.empty')}</p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
                  {audits.map((a) => {
                    const style = ACTION_STYLE[a.action] ?? ACTION_STYLE.update!;
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-bg-3"
                      >
                        <span className="font-mono text-text-2">{fmtTime(a.createdAt)}</span>
                        <span
                          className={cn(
                            'rounded-full border bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em]',
                            style.className,
                          )}
                        >
                          {t(style.labelKey)}
                        </span>
                        <span className="font-mono text-text-0">{a.parameterKey}</span>
                        <span className="font-mono text-text-2">
                          {a.oldValue === null ? '—' : fmtNum(a.oldValue)} → {fmtNum(a.newValue)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
