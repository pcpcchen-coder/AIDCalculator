import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type TokenKind = 'var' | 'fn' | 'num' | 'op';

interface Token {
  kind: TokenKind;
  text: string;
}

const KNOWN_FUNCTIONS = new Set([
  'ceil', 'floor', 'round', 'sqrt', 'abs', 'min', 'max', 'log', 'log10', 'exp', 'pow', 'sum',
]);

/** 簡易公式著色：變數 cyan、常數 amber、函數 green、運算子 text-1 */
function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const re = /([A-Za-z_][A-Za-z0-9_]*)|([0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) tokens.push({ kind: 'op', text: src.slice(last, m.index) });
    if (m[1] !== undefined) {
      tokens.push({ kind: KNOWN_FUNCTIONS.has(m[1]) ? 'fn' : 'var', text: m[1] });
    } else {
      tokens.push({ kind: 'num', text: m[2]! });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ kind: 'op', text: src.slice(last) });
  return tokens;
}

const KIND_CLASS: Record<TokenKind, string> = {
  var: 'text-accent',
  fn: 'text-green',
  num: 'text-power',
  op: 'text-text-1',
};

interface FormulaTextProps {
  text: string;
  className?: string;
}

/** 公式展示（JetBrains Mono，變數著色） */
export default function FormulaText({ text, className }: FormulaTextProps) {
  const tokens = useMemo(() => tokenize(text), [text]);
  return (
    <span className={cn('font-mono', className)}>
      {tokens.map((t, i) => (
        <span key={i} className={KIND_CLASS[t.kind]}>
          {t.text}
        </span>
      ))}
    </span>
  );
}
