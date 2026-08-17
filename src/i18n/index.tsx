import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, LANGS, type Lang } from "./locales";

export type { Lang };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** 以 key 取譯文；找不到時回退繁中 → 再回退 key 本身 */
  t: (key: string) => string;
  langs: typeof LANGS;
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = "dcgen-lang";

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh-CN" || saved === "zh-TW") return saved;
  } catch {
    /* ignore */
  }
  return "zh-TW";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      langs: LANGS,
      t: (key: string) =>
        dictionaries[lang][key] ?? dictionaries["zh-TW"][key] ?? dictionaries.en[key] ?? key,
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** 變數插值：tpl("a.b", { n: 5 }) —— 譯文中以 {n} 佔位 */
export function tpl(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), text);
}
