import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ParamItem } from './types';
import { fmtNum, isBoolParam, isModified, isRatioParam } from './types';

/** 數值變化時 400ms 回彈 count 動畫（還原／更新後） */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 400, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{fmtNum(display)}</span>;
}

interface ParameterRowProps {
  param: ParamItem;
  /** 新增／更新後的 cyan 閃爍 */
  flash?: boolean;
  onUpdate: (key: string, value: number) => Promise<void>;
  onReset: (key: string) => Promise<void>;
  onRequestDelete: (param: ParamItem) => void;
}

export default function ParameterRow({ param, flash, onUpdate, onReset, onRequestDelete }: ParameterRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sliderDraft, setSliderDraft] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modified = isModified(param);
  const boolParam = isBoolParam(param);
  const ratioParam = isRatioParam(param);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    if (boolParam) return;
    setDraft(String(param.value));
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const commitEdit = async () => {
    const num = Number(draft);
    if (draft.trim() === '' || Number.isNaN(num) || !Number.isFinite(num)) {
      setError('請輸入有效數值');
      setShakeNonce((n) => n + 1);
      return;
    }
    setBusy(true);
    try {
      await onUpdate(param.key, num);
      setEditing(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失敗');
      setShakeNonce((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const commitSlider = async (vals: number[]) => {
    const v = vals[0];
    setSliderDraft(null);
    if (Math.abs(v - param.value) < 1e-12) return;
    setBusy(true);
    try {
      await onUpdate(param.key, v);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新失敗');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await onReset(param.key);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '還原失敗');
    } finally {
      setBusy(false);
    }
  };

  const sliderValue = sliderDraft ?? param.value;
  const sliderMax = param.unit === '%' ? 100 : Math.max(1, param.value);
  const sliderStep = param.unit === '%' ? 0.5 : 0.0001;

  return (
    <motion.div
      layout="position"
      animate={flash ? { backgroundColor: ['rgba(34,211,238,0.14)', 'rgba(34,211,238,0)'] } : undefined}
      transition={{ duration: 1.2 }}
      className="grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-bg-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-4 md:px-5"
    >
      {/* 1. Key */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-all font-mono text-sm text-text-0">{param.key}</span>
          {param.isCustom && (
            <span className="rounded-full border border-violet/50 px-2 py-0.5 text-[10px] tracking-[0.08em] text-violet">
              自訂
            </span>
          )}
        </div>
        {param.unit && !boolParam && (
          <div className="mt-0.5 text-xs text-text-2">單位：{param.unit}</div>
        )}
      </div>

      {/* 2. 說明 */}
      <p className="max-w-[280px] text-xs leading-relaxed text-text-1">
        {param.description ?? '—'}
      </p>

      {/* 3. 數值 */}
      <div className="min-w-0">
        {boolParam ? (
          <div className="flex items-center gap-3">
            <Switch
              checked={param.value === 1}
              disabled={busy}
              onCheckedChange={async (checked) => {
                setBusy(true);
                try {
                  await onUpdate(param.key, checked ? 1 : 0);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : '更新失敗');
                } finally {
                  setBusy(false);
                }
              }}
            />
            <span className="font-mono text-sm text-text-1">{param.value === 1 ? '啟用' : '停用'}</span>
          </div>
        ) : editing ? (
          <motion.div
            key={shakeNonce}
            animate={shakeNonce ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2"
          >
            <motion.div
              initial={{ scaleY: 0.9, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <input
                ref={inputRef}
                value={draft}
                disabled={busy}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void commitEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className={cn(
                  'w-32 rounded-lg border bg-bg-1 px-3 py-1.5 font-mono text-sm text-text-0 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]',
                  error ? 'border-red' : 'border-line focus:border-accent',
                )}
              />
              {param.unit && <span className="font-mono text-xs text-text-2">{param.unit}</span>}
              <button
                type="button"
                aria-label="確認"
                disabled={busy}
                onClick={() => void commitEdit()}
                className="rounded-lg border border-line bg-bg-2 p-1.5 text-green transition-colors hover:border-green/50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="取消"
                disabled={busy}
                onClick={cancelEdit}
                className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:border-red/50 hover:text-red"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
            {error && <span className="text-xs text-red">{error}</span>}
          </motion.div>
        ) : ratioParam ? (
          <div className="flex items-center gap-3">
            <Slider
              className="w-[120px] shrink-0"
              min={0}
              max={sliderMax}
              step={sliderStep}
              disabled={busy}
              value={[sliderValue]}
              onValueChange={(vals) => setSliderDraft(vals[0])}
              onValueCommit={(vals) => void commitSlider(vals)}
            />
            <button
              type="button"
              onClick={startEdit}
              title="點擊直接輸入數值"
              className={cn(
                'rounded-md px-1.5 py-0.5 font-mono text-sm transition-colors hover:bg-bg-1',
                modified ? 'font-bold text-accent' : 'text-text-0',
              )}
            >
              <AnimatedNumber value={sliderValue} />
            </button>
            <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 font-mono text-[10px] text-text-2">
              {param.unit}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              title="點擊編輯數值"
              className={cn(
                'rounded-md px-1.5 py-0.5 font-mono text-sm transition-colors hover:bg-bg-1',
                modified ? 'font-bold text-accent' : 'text-text-0',
              )}
            >
              <AnimatedNumber value={param.value} />
            </button>
            {param.unit && (
              <span className="rounded-full border border-line bg-bg-1 px-2 py-0.5 font-mono text-[10px] text-text-2">
                {param.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. 預設值＋還原 */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-2">預設 {fmtNum(param.defaultValue)}</span>
        <AnimatePresence>
          {modified && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5"
            >
              <span className="rounded-full border border-power/50 bg-power/10 px-2 py-0.5 text-[10px] tracking-[0.08em] text-power">
                已修改
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="還原預設值"
                    disabled={busy}
                    onClick={() => void handleReset()}
                    className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>還原為預設值</TooltipContent>
              </Tooltip>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* 5. 操作 */}
      <div className="flex items-center justify-end gap-1.5">
        {param.isCustom ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`刪除參數 ${param.key}`}
                disabled={busy}
                onClick={() => onRequestDelete(param)}
                className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:border-red/50 hover:text-red"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>刪除此自訂參數</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-not-allowed rounded-lg border border-line/50 bg-bg-2/50 p-1.5 text-text-2/50">
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>內建參數不可刪除</TooltipContent>
          </Tooltip>
        )}
      </div>
    </motion.div>
  );
}
