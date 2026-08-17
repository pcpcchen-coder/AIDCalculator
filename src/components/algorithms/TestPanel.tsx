import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, Play, TriangleAlert } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ParamOption } from './types';
import { extractVariables } from './types';

function fmtResult(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

interface TestPanelProps {
  formula: string;
  /** 變數 → 全域參數 key 綁定（試算時優先預填綁定參數現值） */
  bindings: Record<string, string>;
  paramMap: Map<string, ParamOption>;
  compact?: boolean;
}

/** 試算面板：動態產生變數輸入 → algorithms.test → 結果＋代入過程 */
export default function TestPanel({ formula, bindings, paramMap, compact }: TestPanelProps) {
  const variables = useMemo(() => extractVariables(formula), [formula]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  // 公式變更時重建輸入（綁定參數 → 同名全域參數 預填）
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const v of variables) {
      const boundKey = bindings[v];
      const bound = boundKey ? paramMap.get(boundKey) : undefined;
      const sameName = paramMap.get(v);
      if (bound) next[v] = String(bound.value);
      else if (sameName) next[v] = String(sameName.value);
      else next[v] = '';
    }
    setInputs(next);
    setTouched(false);
    testMut.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula, JSON.stringify(bindings), paramMap]);

  const testMut = trpc.algorithms.test.useMutation();

  const missing = variables.filter((v) => inputs[v] === undefined || inputs[v]!.trim() === '' || Number.isNaN(Number(inputs[v])));

  const runTest = () => {
    const vars: Record<string, number> = {};
    for (const v of variables) vars[v] = Number(inputs[v]);
    setTouched(true);
    testMut.mutate({ formula, variables: vars });
  };

  return (
    <div className={cn('rounded-xl border border-line bg-bg-2', compact ? 'p-4' : 'p-5')}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="rounded-lg border border-line bg-bg-1 p-2 text-accent">
          <FlaskConical className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-medium text-text-0">試算面板</h3>
        <span className="text-xs text-text-2">同名全域參數已自動帶入，可覆寫</span>
      </div>

      {variables.length === 0 ? (
        <p className="text-sm text-text-2">此公式無自由變數，可直接試算。</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {variables.map((v) => {
            const boundKey = bindings[v];
            const src = boundKey ?? (paramMap.has(v) ? v : null);
            const unit = src ? paramMap.get(src)?.unit : null;
            const invalid = touched && (inputs[v]?.trim() === '' || Number.isNaN(Number(inputs[v])));
            return (
              <label key={v} className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs text-text-1">
                  <span className="font-mono text-accent">{v}</span>
                  {src && (
                    <span className="rounded-full border border-line bg-bg-1 px-1.5 py-0.5 font-mono text-[10px] text-text-2">
                      參數 {src}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <input
                    value={inputs[v] ?? ''}
                    onChange={(e) => setInputs((s) => ({ ...s, [v]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && missing.length === 0) runTest();
                    }}
                    placeholder="輸入數值"
                    inputMode="decimal"
                    className={cn(
                      'w-full rounded-lg border bg-bg-1 px-3 py-2 font-mono text-sm text-text-0 outline-none transition-shadow placeholder:text-text-2 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]',
                      invalid ? 'border-red' : 'border-line focus:border-accent',
                    )}
                  />
                  {unit && <span className="shrink-0 font-mono text-xs text-text-2">{unit}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <Button
          disabled={testMut.isPending || missing.length > 0}
          onClick={runTest}
          className="bg-accent text-bg-0 transition-all hover:scale-[1.02] hover:shadow-glow active:scale-[0.97]"
        >
          <Play className="h-4 w-4" />
          {testMut.isPending ? '計算中…' : '試算'}
        </Button>
        {touched && missing.length > 0 && (
          <span className="text-xs text-power">
            尚缺變數：{missing.map((m) => <code key={m} className="mx-0.5 font-mono">{m}</code>)}
          </span>
        )}
      </div>

      <AnimatePresence>
        {testMut.isError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2.5 rounded-lg border border-red/50 bg-red/5 px-4 py-3 text-sm text-red"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{testMut.error.message}</span>
          </motion.div>
        )}
        {testMut.isSuccess && (
          <motion.div
            key={testMut.data.result}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-lg border border-accent/30 bg-bg-1 px-4 py-3"
          >
            <div className="text-xs text-text-2">計算結果</div>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-1 font-mono text-2xl font-bold text-accent md:text-3xl"
            >
              {fmtResult(testMut.data.result)}
            </motion.div>
            <div className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
              {Object.entries(testMut.data.usedVariables).map(([name, val], i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.2 }}
                  className="font-mono text-xs text-text-2"
                >
                  {name} = {fmtResult(val)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
