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
import type { AlgoItem, ParamOption } from './types';
import { algoCategoryMeta, extractVariables, parseBindings } from './types';
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
      toast.error(e instanceof Error ? e.message : '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const changeBinding = (variable: string, paramKey: string) => {
    const next = { ...bindings };
    if (paramKey === MANUAL) delete next[variable];
    else next[variable] = paramKey;
    void save({ parameterBindings: next }, '算法已更新（內建算法修改僅影響後續演算）');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已複製${label}`);
    } catch {
      toast.error('複製失敗（瀏覽器未授權剪貼簿）');
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
            {algo.category}
          </span>
          {algo.isBuiltin ? (
            <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-accent">
              內建
            </span>
          ) : (
            <span className="rounded-full border border-violet/50 bg-violet/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-violet">
              自訂
            </span>
          )}
          {modified && (
            <span className="rounded-full border border-power/50 bg-power/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-power">
              已修改
            </span>
          )}
          {!algo.enabled && (
            <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em] text-text-2">
              已停用
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-2">{algo.enabled ? '啟用中' : '已停用'}</span>
            <Switch
              checked={algo.enabled}
              disabled={saving}
              onCheckedChange={(checked) =>
                void save({ enabled: checked }, checked ? '算法已啟用' : '算法已停用（後續演算將略過）')
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
                  void save({ description: descDraft.trim() || null }, '說明已更新').then(() => setEditingDesc(false));
                }}
                className="bg-accent text-bg-0 hover:bg-accent/90"
              >
                <Check className="h-3.5 w-3.5" />
                儲存說明
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingDesc(false)}
                className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
              >
                <X className="h-3.5 w-3.5" />
                取消
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-text-1">
            {algo.description ?? '（尚無說明）'}
            <button
              type="button"
              onClick={() => {
                setDescDraft(algo.description ?? '');
                setEditingDesc(true);
              }}
              className="ml-2 inline-flex items-center gap-1 rounded-md border border-line bg-bg-1 px-1.5 py-0.5 text-xs text-text-2 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Pencil className="h-3 w-3" />
              調整
            </button>
          </p>
        )}
      </div>

      {/* (b) 公式展示卡 */}
      <div className="rounded-lg border border-line bg-bg-1 p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-2">公式</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => void copyText(display, ' LaTeX')}
              className="flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-1 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Copy className="h-3 w-3" />
              複製 LaTeX
            </button>
            <button
              type="button"
              onClick={() => void copyText(algo.formula ?? '', '純文字公式')}
              className="flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-1 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Copy className="h-3 w-3" />
              複製純文字
            </button>
          </div>
        </div>
        {display ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-bg-0 px-4 py-4">
            <CharFade text={display} className="whitespace-pre-wrap text-base leading-relaxed md:text-lg" />
          </div>
        ) : (
          <p className="text-sm text-text-2">此算法為啟發式實作（LPT 裝箱），無封閉公式。</p>
        )}

        {/* 變數表 */}
        {variables.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-text-2">變數</div>
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
                        全域參數 {boundKey}
                      </span>
                    ) : paramMap.has(v) ? (
                      <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 font-mono text-[10px] text-text-1">
                        全域參數 {v}（同名自動帶入）
                      </span>
                    ) : (
                      <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 text-[10px] tracking-[0.08em] text-text-2">
                        使用者輸入
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
            <h3 className="text-sm font-medium text-text-0">參數綁定（可調整）</h3>
            <span className="text-xs text-text-2">將公式變數改綁其他全域參數</span>
          </div>
          <div className="divide-y divide-line rounded-lg border border-line bg-bg-1">
            {variables.map((v) => {
              const current = bindings[v] ?? MANUAL;
              const bound = current !== MANUAL ? paramMap.get(current) : undefined;
              return (
                <div key={v} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <span className="w-32 shrink-0 font-mono text-sm text-accent">{v}</span>
                  <span className="font-mono text-xs text-text-2">
                    {bound ? `現值 ${bound.value}${bound.unit ? ` ${bound.unit}` : ''}` : '手動輸入'}
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
                          手動輸入（不綁定）
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
                      aria-label={`還原變數 ${v} 的綁定`}
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
          此算法為啟發式實作，無法以公式試算。
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
            複製為自訂算法
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => onRequestEdit(algo)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              <Pencil className="h-4 w-4" />
              編輯定義
            </Button>
            <Button
              variant="outline"
              onClick={() => onRequestDuplicate(algo)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              <Copy className="h-4 w-4" />
              複製
            </Button>
            <Button
              variant="outline"
              onClick={() => onRequestDelete(algo)}
              className="border-red/40 bg-transparent text-red hover:bg-red/10 hover:text-red"
            >
              <Trash2 className="h-4 w-4" />
              刪除
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
