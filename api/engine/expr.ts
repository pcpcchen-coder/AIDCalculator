/**
 * 安全數學公式求值器（自訂算法用）
 * 支援：+ - * / % ^、括號、變數、函數 ceil/floor/round/sqrt/abs/min/max/sum/log/exp/pow
 * 不支援任何賦值、屬性存取或函式呼叫白名單外的識別符 —— 無程式碼注入風險。
 */

type Token =
  | { type: "num"; value: number }
  | { type: "ident"; name: string }
  | { type: "op"; op: string }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "comma" };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  sqrt: Math.sqrt,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  log: Math.log,
  log10: Math.log10,
  exp: Math.exp,
  pow: Math.pow,
  sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.eE]/.test(src[j])) j++;
      // 處理科學記號 1e-3
      if ((src[j] === "+" || src[j] === "-") && /[eE]/.test(src[j - 1])) j++;
      while (j < src.length && /[0-9]/.test(src[j])) j++;
      const num = Number(src.slice(i, j));
      if (Number.isNaN(num)) throw new Error(`無效數字: ${src.slice(i, j)}`);
      tokens.push({ type: "num", value: num });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: "ident", name: src.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/%^".includes(ch)) {
      tokens.push({ type: "op", op: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma" });
      i++;
      continue;
    }
    throw new Error(`公式含不支援的字元: '${ch}'`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private vars: Record<string, number>,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  parseExpression(): number {
    let left = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t?.type === "op" && (t.op === "+" || t.op === "-")) {
        this.pos++;
        const right = this.parseTerm();
        left = t.op === "+" ? left + right : left - right;
      } else break;
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t?.type === "op" && (t.op === "*" || t.op === "/" || t.op === "%")) {
        this.pos++;
        const right = this.parseFactor();
        left = t.op === "*" ? left * right : t.op === "/" ? left / right : left % right;
      } else break;
    }
    return left;
  }

  private parseFactor(): number {
    // 一元負號
    const t = this.peek();
    if (t?.type === "op" && t.op === "-") {
      this.pos++;
      return -this.parseFactor();
    }
    if (t?.type === "op" && t.op === "+") {
      this.pos++;
      return this.parseFactor();
    }
    const base = this.parseAtom();
    const next = this.peek();
    if (next?.type === "op" && next.op === "^") {
      this.pos++;
      const exp = this.parseFactor();
      return Math.pow(base, exp);
    }
    return base;
  }

  private parseAtom(): number {
    const t = this.peek();
    if (!t) throw new Error("公式意外結束");
    if (t.type === "num") {
      this.pos++;
      return t.value;
    }
    if (t.type === "ident") {
      this.pos++;
      const next = this.peek();
      if (next?.type === "lparen") {
        // 函數呼叫
        const fn = FUNCTIONS[t.name];
        if (!fn) throw new Error(`不支援的函數: ${t.name}（可用：${Object.keys(FUNCTIONS).join(", ")}）`);
        this.pos++; // consume (
        const args: number[] = [];
        if (this.peek()?.type !== "rparen") {
          args.push(this.parseExpression());
          while (this.peek()?.type === "comma") {
            this.pos++;
            args.push(this.parseExpression());
          }
        }
        if (this.peek()?.type !== "rparen") throw new Error("函數呼叫缺少右括號");
        this.pos++;
        return fn(...args);
      }
      // 變數
      if (!(t.name in this.vars)) throw new Error(`未定義的變數: ${t.name}`);
      return this.vars[t.name];
    }
    if (t.type === "lparen") {
      this.pos++;
      const v = this.parseExpression();
      if (this.peek()?.type !== "rparen") throw new Error("缺少右括號");
      this.pos++;
      return v;
    }
    throw new Error(`公式語法錯誤於 token: ${JSON.stringify(t)}`);
  }
}

/** 求值公式；拋出 Error 附中文說明 */
export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  const tokens = tokenize(formula);
  if (tokens.length === 0) throw new Error("公式不可為空");
  const parser = new Parser(tokens, variables);
  const result = parser.parseExpression();
  if (typeof result !== "number" || Number.isNaN(result)) throw new Error("公式計算結果非數值");
  return result;
}

/** 從公式中擷取所有變數名（非函數名） */
export function extractVariables(formula: string): string[] {
  const tokens = tokenize(formula);
  const names = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "ident") {
      const next = tokens[i + 1];
      if (next?.type === "lparen") continue; // 函數
      names.add(t.name);
    }
  }
  return [...names];
}

/** 語法檢查（不帶變數值，只驗證結構與白名單） */
export function validateFormula(formula: string): { ok: boolean; error?: string; variables: string[] } {
  try {
    const variables = extractVariables(formula);
    // 以 dummy 值試跑結構（除以零等數值問題不視為語法錯誤）
    const dummy: Record<string, number> = Object.fromEntries(variables.map((v) => [v, 1]));
    evaluateFormula(formula, dummy);
    return { ok: true, variables };
  } catch (e) {
    return { ok: false, error: (e as Error).message, variables: [] };
  }
}
