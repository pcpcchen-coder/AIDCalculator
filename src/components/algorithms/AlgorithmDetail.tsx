import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tpl, useI18n } from '@/i18n';
import type { AlgoItem, ParamOption } from './types';
import { algoCategoryLabel, algoCategoryMeta, extractVariables, parseBindings } from './types';
import FormulaText from './FormulaText';
import TestPanel from './TestPanel';

export interface AlgoUpdateData {
  name?: string;
  description?: string | null;
  parameterBindings?: Record<string, string>;
  enabled?: boolean;
  category?: string;
}

/** 公式卡進場：逐字元淡入（200ms 內完成） */
function CharFade({ text, className }: { text: string; className?: string }) {
  const chars = useMemo(() => text.split(''), [text]);
  const step = chars.length > 0 ? 0.2 / chars.length : 0;
  return (
    <span className={cn('font-mono', className)}>
      {chars.map((c, i) => (
        <motion.span
          key={`${i}-${c}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * step, duration: 0.08 }}
          className={/[A-Za-z_]/.test(c) ? 'text-accent' : /[0-9]/.test(c) ? 'text-power' : 'text-text-1'}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

const MANUAL = '__manual__';

interface AlgorithmDetailProps {
  algo: AlgoItem;
  paramOptions: ParamOption[];
  paramMap: Map<string, ParamOption>;
  onUpdate: (key: string, data: AlgoUpdateData) => Promise<void>;
  onRequestDuplicate: (algo: AlgoItem) => void;
  onRequestDelete: (algo: AlgoItem) => void;
  onRequestEdit: (algo: AlgoItem) => void;
}

export default function AlgorithmDetail({
  algo,
  paramOptions,
  paramMap,
  onUpdate,
  onRequestDuplicate,
  onRequestDelete,
  onRequestEdit,
}: AlgorithmDetailProps) {
  const { t } = useI18n();
  const bindings = useMemo(() => parseBindings(algo.parameterBindings), [algo.parameterBindings]);
  const variables = useMemo(() => extractVariables(algo.formula), [algo.formula]);
  const meta = algoCategoryMeta(algo.category);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const modified = algo.version !== '1.0';
  const display = algo.formulaDisplay || algo.formula || '';

  const save = async (data: AlgoUpdateData, toastMsg?: string) => {
    setSaving(true);
    try {
      await onUpdate(algo.key, data);
      if (toastMsg) toast.success(toastMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('algos.err.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const changeBinding = (variable: string, paramKey: string) => {
    const next = { ...bindings };
    if (paramKey === MANUAL) delete next[variable];
    else next[variable] = paramKey;
    void save({ parameterBindings: next }, t('algos.toast.updated'));
  };

  const copyText = async (text: string, toastKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t(toastKey));
    } catch {
      toast.error(t('algos.toast.copyFailed'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      {/* (a) 標題區 */}
      <div className="rounded-xl border border-line bg-bg-2 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {algo.paperRef && (
            <span className="rounded-md border border-accent/50 px-2 py-0.5 font-mono text-xs text-accent">
              {algo.paperRef}
            </span>
          )}
          <h2 className="text-xl font-bold text-text-0 md:text-2xl">{algo.name}</h2>
          <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 font-mono text-[10px] text-text-1">
            v{algo.version}
          </span>
          <span className={cn('rounded-full border border-line bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em]', meta.color)}>
            {algoCategoryLabel(t, algo.category)}
          </span>
          {algo.isBuiltin ? (
            <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-accent">
              {t('algos.badge.builtin')}
            </span>
          ) : (
            <span className="rounded-full border border-violet/50 bg-violet/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-violet">
              {t('algos.badge.custom')}
            </span>
          )}
          {modified && (
            <span className="rounded-full border border-power/50 bg-power/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-power">
              {t('algos.badge.modified')}
            </span>
          )}
          {!algo.enabled && (
            <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em] text-text-2">
              {t('algos.badge.disabled')}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-2">{algo.enabled ? t('algos.detail.enabled') : t('algos.detail.disabled')}</span>
            <Switch
              checked={algo.enabled}
              disabled={saving}
              onCheckedChange={(checked) =>
                void save({ enabled: checked }, checked ? t('algos.toast.enabled') : t('algos.toast.disabled'))
              }
            />
          </span>
        </div>

        {/* 說明（可調整） */}
        {editingDesc ? (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-accent bg-bg-1 px-3 py-2 text-sm text-text-0 outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={() => {
                  void save({ description: descDraft.trim() || null }, t('algos.toast.descUpdated')).then(() => setEditingDesc(false));
                }}
                className="bg-accent text-bg-0 hover:bg-accent/90"
              >
                <Check className="h-3.5 w-3.5" />
                {t('algos.detail.saveDesc')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingDesc(false)}
                className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
              >
                <X className="h-3.5 w-3.5" />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-text-1">
            {algo.description ?? t('algos.detail.noDesc')}
            <button
              type="button"
              onClick={() => {
                setDescDraft(algo.description ?? '');
                setEditingDesc(true);
              }}
              className="ml-2 inline-flex items-center gap-1 rounded-md border border-line bg-bg-1 px-1.5 py-0.5 text-xs text-text-2 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Pencil className="h-3 w-3" />
              {t('algos.detail.editDesc')}
            </button>
          </p>
        )}
      </div>

      {/* (b) 公式展示卡 */}
      <div className="rounded-lg border border-line bg-bg-1 p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-2">{t('algos.detail.formula')}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => void copyText(display, 'algos.toast.copiedLatex')}
              className="flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-1 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Copy className="h-3 w-3" />
              {t('algos.detail.copyLatex')}
            </button>
            <button
              type="button"
              onClick={() => void copyText(algo.formula ?? '', 'algos.toast.copiedPlain')}
              className="flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-1 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Copy className="h-3 w-3" />
              {t('algos.detail.copyPlain')}
            </button>
          </div>
        </div>
        {display ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-bg-0 px-4 py-4">
            <CharFade text={display} className="whitespace-pre-wrap text-base leading-relaxed md:text-lg" />
          </div>
        ) : (
          <p className="text-sm text-text-2">{t('algos.detail.heuristic')}</p>
        )}

        {/* 變數表 */}
        {variables.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-text-2">{t('algos.detail.variables')}</div>
            <div className="divide-y divide-line rounded-lg border border-line">
              {variables.map((v) => {
                const boundKey = bindings[v];
                const bound = boundKey ? paramMap.get(boundKey) : undefined;
                return (
                  <div key={v} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <FormulaText text={v} className="w-36 shrink-0 text-sm" />
                    <span className="min-w-0 flex-1 truncate text-xs text-text-1">
                      {bound?.description ?? (paramMap.get(v)?.description || '—')}
                    </span>
                    {boundKey ? (
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                        {tpl(t('algos.detail.boundParam'), { key: boundKey })}
                      </span>
                    ) : paramMap.has(v) ? (
                      <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 font-mono text-[10px] text-text-1">
                        {tpl(t('algos.detail.sameNameParam'), { key: v })}
                      </span>
                    ) : (
                      <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em] text-text-2">
                        {t('algos.detail.userInput')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* (c) 參數綁定區 */}
      {variables.length > 0 && (
        <div className="rounded-xl border border-line bg-bg-2 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-0">{t('algos.detail.bindings')}</h3>
            <span className="text-xs text-text-2">{t('algos.detail.bindingsHint')}</span>
          </div>
          <div className="divide-y divide-line rounded-lg border border-line bg-bg-1">
            {variables.map((v) => {
              const current = bindings[v] ?? MANUAL;
              const bound = current !== MANUAL ? paramMap.get(current) : undefined;
              return (
                <div key={v} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <span className="w-32 shrink-0 font-mono text-sm text-accent">{v}</span>
                  <span className="font-mono text-xs text-text-2">
                    {bound
                      ? tpl(t('algos.detail.currentValue'), {
                          value: bound.value,
                          unit: bound.unit ? ` ${bound.unit}` : '',
                        })
                      : t('algos.detail.manual')}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Select
                      value={current}
                      disabled={saving}
                      onValueChange={(val) => changeBinding(v, val)}
                    >
                      <SelectTrigger className="h-8 w-52 border-line bg-bg-2 text-xs text-text-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 border-line bg-bg-1">
                        <SelectItem value={MANUAL} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                          {t('algos.detail.manualOption')}
                        </SelectItem>
                        {paramOptions.map((p) => (
                          <SelectItem key={p.key} value={p.key} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                            <span className="font-mono">{p.key}</span>
                            {p.unit && <span className="ml-1 text-text-2">（{p.unit}）</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      aria-label={tpl(t('algos.detail.resetBindingAria'), { var: v })}
                      disabled={saving || current === MANUAL}
                      onClick={() => changeBinding(v, MANUAL)}
                      className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* (d) 試算面板 */}
      {algo.formula ? (
        <TestPanel formula={algo.formula} bindings={bindings} paramMap={paramMap} />
      ) : (
        <div className="rounded-xl border border-line bg-bg-2 p-5 text-sm text-text-2">
          {t('algos.detail.heuristicTest')}
        </div>
      )}

      {/* (e) 操作列 */}
      <div className="flex flex-wrap items-center gap-2">
        {algo.isBuiltin ? (
          <Button
            variant="outline"
            onClick={() => onRequestDuplicate(algo)}
            className="border-accent/40 bg-transparent text-accent hover:bg-accent/10 hover:text-accent"
          >
            <Copy className="h-4 w-4" />
            {t('algos.detail.duplicate')}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => onRequestEdit(algo)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              <Pencil className="h-4 w-4" />
              {t('algos.detail.edit')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onRequestDuplicate(algo)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              <Copy className="h-4 w-4" />
              {t('algos.detail.copy')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onRequestDelete(algo)}
              className="border-red/40 bg-transparent text-red hover:bg-red/10 hover:text-red"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
