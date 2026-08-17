import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import DocSection from './DocSection';
import { useAnimatedNumber } from './use-animated-number';

type RedundancyMode = 'N' | 'N+1' | 'N+2' | '2N' | 'xN-y';

const MODES: RedundancyMode[] = ['N', 'N+1', 'N+2', '2N', 'xN-y'];

const DEFINITIONS: { term: string; def: string }[] = [
  { term: 'N', def: '恰好滿足需求的台數，無備援。' },
  { term: 'N+1', def: '需求台數＋1 台備援。' },
  { term: 'N+2', def: '需求台數＋2 台備援。' },
  { term: '2N', def: '完整雙套系統（A/B 路），任一路可獨立承載全部負載。' },
  { term: 'xN-y', def: 'x 台分攤負載，y 台即足夠；有效容量 = y/x × 額定容量（式 15）。' },
];

interface CalcResult {
  need: number;
  installed: number;
  effectiveKw: number;
  valid: boolean;
}

/** 冗餘台數計算（對應算法管理之試算邏輯） */
function computeRedundancy(
  mode: RedundancyMode,
  demandKw: number,
  unitKw: number,
  x: number,
  y: number,
): CalcResult {
  if (unitKw <= 0 || demandKw < 0 || demandKw === 0) {
    return { need: 0, installed: 0, effectiveKw: 0, valid: false };
  }
  const need = Math.ceil(demandKw / unitKw); // N+r → ceil(demand/cap)+r
  switch (mode) {
    case 'N':
      return { need, installed: need, effectiveKw: need * unitKw, valid: true };
    case 'N+1':
      return { need, installed: need + 1, effectiveKw: need * unitKw, valid: true };
    case 'N+2':
      return { need, installed: need + 2, effectiveKw: need * unitKw, valid: true };
    case '2N':
      return { need, installed: need * 2, effectiveKw: need * unitKw, valid: true };
    case 'xN-y': {
      if (x < 1 || y < 1 || y >= x) return { need, installed: 0, effectiveKw: 0, valid: false };
      // xN/y → x*ceil(ceil(demand/(y/x*cap))/x)
      const perUnitEffective = (y / x) * unitKw;
      const rawUnits = Math.ceil(demandKw / perUnitEffective);
      const installed = x * Math.ceil(rawUnits / x);
      return { need: rawUnits, installed, effectiveKw: installed * perUnitEffective, valid: true };
    }
  }
}

function ResultCell({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const display = useAnimatedNumber(value, 400);
  return (
    <div className="rounded-lg border border-line bg-bg-1 px-4 py-3">
      <div className="text-xs text-text-2">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold text-accent">
        {Math.round(display).toLocaleString('en-US')}
        {suffix && <span className="ml-1 text-sm font-medium text-text-2">{suffix}</span>}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-line bg-bg-1 px-3 py-2.5 font-mono text-sm text-text-0 outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]';

/** Section 7 — 冗餘語彙：圖解＋定義列＋互動冗餘計算器 */
export default function RedundancySection() {
  const [mode, setMode] = useState<RedundancyMode>('N+1');
  const [demand, setDemand] = useState('1200');
  const [unitCap, setUnitCap] = useState('500');
  const [x, setX] = useState('4');
  const [y, setY] = useState('3');

  const result = useMemo(
    () =>
      computeRedundancy(
        mode,
        Number.parseFloat(demand) || 0,
        Number.parseFloat(unitCap) || 0,
        Number.parseInt(x, 10) || 0,
        Number.parseInt(y, 10) || 0,
      ),
    [mode, demand, unitCap, x, y],
  );

  return (
    <DocSection id="redundancy" title="冗餘語彙">
      <div className="flex flex-col gap-6">
        {/* 全寬 redundancy-diagram.svg */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="overflow-hidden rounded-xl border border-line bg-bg-1"
        >
          <img
            src="/redundancy-diagram.svg"
            alt="冗餘語彙圖解：N / N+1 / N+2 / 2N / xN-y 機組配置"
            loading="lazy"
            className="h-auto w-full"
          />
        </motion.div>

        {/* 定義列（stagger fade-up） */}
        <ul className="flex flex-col gap-2.5">
          {DEFINITIONS.map((d, i) => (
            <motion.li
              key={d.term}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.06 }}
              className="flex items-baseline gap-3 rounded-lg border border-line bg-bg-2 px-4 py-3"
            >
              <span className="w-14 shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-center font-mono text-xs font-medium text-accent">
                {d.term}
              </span>
              <span className="text-sm leading-relaxed text-text-1">{d.def}</span>
            </motion.li>
          ))}
        </ul>

        {/* 互動冗餘計算器 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-xl border border-line bg-bg-2 p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5">
            <Calculator className="h-4 w-4 text-accent" />
            <h3 className="text-base font-medium text-text-0">冗餘計算器</h3>
            <span className="font-mono text-xs text-text-2">— 算法試算面板展示版</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-text-1">需求容量（kW）</span>
              <input
                type="number"
                min={0}
                value={demand}
                onChange={(e) => setDemand(e.target.value)}
                className={inputClass}
                aria-label="需求容量 kW"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-text-1">單機容量（kW）</span>
              <input
                type="number"
                min={0}
                value={unitCap}
                onChange={(e) => setUnitCap(e.target.value)}
                className={inputClass}
                aria-label="單機容量 kW"
              />
            </label>
          </div>

          {/* Segmented control：layoutId 滑塊 */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-line bg-bg-1 p-1">
              {MODES.map((m) => {
                const active = m === mode;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      'relative rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors duration-150',
                      active ? 'text-accent' : 'text-text-2 hover:text-text-1',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="redundancy-mode-pill"
                        className="absolute inset-0 rounded-full bg-bg-2 shadow-glow"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{m}</span>
                  </button>
                );
              })}
            </div>
            {mode === 'xN-y' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center gap-2"
              >
                <label className="flex items-center gap-1.5 text-xs text-text-1">
                  x
                  <input
                    type="number"
                    min={1}
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    className={cn(inputClass, 'w-20 px-2 py-1.5')}
                    aria-label="xN-y 之 x（分攤台數）"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-text-1">
                  y
                  <input
                    type="number"
                    min={1}
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    className={cn(inputClass, 'w-20 px-2 py-1.5')}
                    aria-label="xN-y 之 y（足夠台數）"
                  />
                </label>
              </motion.div>
            )}
          </div>

          {/* 結果（Mono count-up 400ms） */}
          {result.valid ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ResultCell label={mode === 'xN-y' ? '需求台數（未取整）' : '需求台數 N'} value={result.need} suffix="台" />
              <ResultCell label="安裝台數" value={result.installed} suffix="台" />
              <ResultCell label="有效容量" value={result.effectiveKw} suffix="kW" />
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-power/40 bg-power/5 px-4 py-3 text-sm text-power">
              {mode === 'xN-y'
                ? '請輸入有效的需求容量、單機容量，且 xN-y 需滿足 x > y ≥ 1。'
                : '請輸入有效的需求容量與單機容量（皆須大於 0）。'}
            </p>
          )}
        </motion.div>
      </div>
    </DocSection>
  );
}
