import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CircleCheck, CircleX, CornerDownLeft } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tpl, useI18n } from '@/i18n';
import type { AlgoItem, ParamOption } from './types';
import { ALGO_KEY_PATTERN, algoCategoryLabel, extractVariables, parseBindings, sortAlgoCategories } from './types';
import FormulaText from './FormulaText';
import TestPanel from './TestPanel';

const MANUAL = '__manual__';

const fieldMotion = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const, delay: 0.05 + i * 0.04 },
});

interface AlgorithmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 提供則為編輯模式（僅自訂算法可改公式） */
  algo?: AlgoItem | null;
  existingKeys: string[];
  categories: string[];
  paramOptions: ParamOption[];
  paramMap: Map<string, ParamOption>;
  onSaved: (key: string, mode: 'create' | 'edit') => void;
}

/** 新增／編輯自訂算法右側抽屜（520px），公式即時語法檢查 */
export default function AlgorithmDrawer({
  open,
  onOpenChange,
  algo,
  existingKeys,
  categories,
  paramOptions,
  paramMap,
  onSaved,
}: AlgorithmDrawerProps) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const isEdit = !!algo;

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('自訂算法');
  const [description, setDescription] = useState('');
  const [formula, setFormula] = useState('');
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [debouncedFormula, setDebouncedFormula] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formulaRef = useRef<HTMLTextAreaElement>(null);

  // 初始化表單
  useEffect(() => {
    if (!open) return;
    setKey(algo?.key ?? '');
    setName(algo?.name ?? '');
    setCategory(algo?.category ?? '自訂算法');
    setDescription(algo?.description ?? '');
    setFormula(algo?.formula ?? '');
    setDebouncedFormula(algo?.formula ?? '');
    setBindings(parseBindings(algo?.parameterBindings ?? null));
  }, [open, algo]);

  // 公式防抖 → 即時 validate
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedFormula(formula), 300);
    return () => window.clearTimeout(t);
  }, [formula]);

  const validateQuery = trpc.algorithms.validate.useQuery(
    { formula: debouncedFormula },
    { enabled: debouncedFormula.trim().length > 0, retry: false },
  );

  const syntaxOk = debouncedFormula.trim().length > 0 && validateQuery.data?.ok === true;
  const syntaxError =
    debouncedFormula.trim().length > 0 && validateQuery.data && !validateQuery.data.ok
      ? validateQuery.data.error ?? t('algos.drawer.syntaxError')
      : null;
  const formulaVariables = useMemo(
    () => (syntaxOk ? validateQuery.data?.variables ?? extractVariables(formula) : []),
    [syntaxOk, validateQuery.data, formula],
  );

  const keyError = useMemo(() => {
    if (isEdit || !key) return null;
    if (!ALGO_KEY_PATTERN.test(key)) return t('algos.err.keyPattern');
    if (existingKeys.includes(key)) return t('algos.err.keyExists');
    return null;
  }, [isEdit, key, existingKeys, t]);

  const formulaChanged = isEdit && algo ? formula !== (algo.formula ?? '') : true;
  const canSubmit =
    name.trim() !== '' &&
    (isEdit || (key.trim() !== '' && !keyError)) &&
    formula.trim() !== '' &&
    // 公式有變更時必須通過 validate 才可存
    (!formulaChanged || syntaxOk) &&
    !submitting;

  const createMut = trpc.algorithms.create.useMutation({
    onSuccess: () => void utils.algorithms.list.invalidate(),
  });
  const updateMut = trpc.algorithms.update.useMutation({
    onSuccess: () => void utils.algorithms.list.invalidate(),
  });

  const allCategories = useMemo(() => {
    const set = new Set(sortAlgoCategories(categories));
    set.add('自訂算法');
    return [...set];
  }, [categories]);

  const insertParam = (paramKey: string) => {
    if (!paramKey) return;
    const el = formulaRef.current;
    if (!el) {
      setFormula((f) => f + paramKey);
      return;
    }
    const start = el.selectionStart ?? formula.length;
    const end = el.selectionEnd ?? formula.length;
    const next = formula.slice(0, start) + paramKey + formula.slice(end);
    setFormula(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + paramKey.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const cleanBindings = Object.fromEntries(
        Object.entries(bindings).filter(([v, k]) => k && formulaVariables.includes(v)),
      );
      if (isEdit && algo) {
        await updateMut.mutateAsync({
          key: algo.key,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            category,
            ...(formulaChanged ? { formula } : {}),
            parameterBindings: cleanBindings,
          },
        });
        toast.success(t('algos.drawer.toastUpdated'));
        onSaved(algo.key, 'edit');
      } else {
        await createMut.mutateAsync({
          key: key.trim(),
          name: name.trim(),
          category,
          description: description.trim() || null,
          formula,
          parameterBindings: cleanBindings,
        });
        toast.success(t('algos.drawer.toastCreated'));
        onSaved(key.trim(), 'create');
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('algos.drawer.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-line bg-bg-1 sm:max-w-[520px]"
      >
        <SheetHeader>
          <SheetTitle className="text-text-0">{isEdit ? t('algos.drawer.titleEdit') : t('algos.drawer.titleCreate')}</SheetTitle>
          <SheetDescription className="text-text-1">
            {t('algos.drawer.descA')}
            <code className="font-mono text-accent">storage_power_share</code>
            {t('algos.drawer.descB')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 flex flex-col gap-5 px-4 pb-6">
          {/* Key（僅新增） */}
          {!isEdit && (
            <motion.div {...fieldMotion(0)} className="flex flex-col gap-1.5">
              <Label htmlFor="algo-key" className="text-text-1">
                {t('algos.drawer.key')} <span className="text-red">*</span>
              </Label>
              <Input
                id="algo-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t('algos.drawer.keyPlaceholder')}
                className={cn(
                  'border-line bg-bg-0 font-mono text-text-0 placeholder:text-text-2',
                  keyError && 'border-red',
                )}
              />
              {keyError ? (
                <p className="text-xs text-red">{keyError}</p>
              ) : (
                <p className="text-xs text-text-2">{t('algos.drawer.keyHint')}</p>
              )}
            </motion.div>
          )}

          {/* 名稱＋分類＋版本 */}
          <motion.div {...fieldMotion(1)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="algo-name" className="text-text-1">
                {t('algos.drawer.name')} <span className="text-red">*</span>
              </Label>
              <Input
                id="algo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('algos.drawer.namePlaceholder')}
                className="border-line bg-bg-0 text-text-0 placeholder:text-text-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-text-1">{t('algos.drawer.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-line bg-bg-0 text-text-0">
                  <SelectValue placeholder={t('algos.drawer.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="border-line bg-bg-1">
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                      {algoCategoryLabel(t, c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div {...fieldMotion(2)} className="flex flex-col gap-1.5">
            <Label htmlFor="algo-desc" className="text-text-1">
              {t('algos.drawer.description')}
            </Label>
            <Textarea
              id="algo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('algos.drawer.descPlaceholder')}
              rows={2}
              className="border-line bg-bg-0 text-text-0 placeholder:text-text-2"
            />
            <p className="text-xs text-text-2">{tpl(t('algos.drawer.versionNote'), { version: algo?.version ?? '1.0' })}</p>
          </motion.div>

          {/* 公式編輯器 */}
          <motion.div {...fieldMotion(3)} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="algo-formula" className="text-text-1">
                {t('algos.drawer.formula')} <span className="text-red">*</span>
              </Label>
              {/* 插入參數 */}
              <Select onValueChange={insertParam}>
                <SelectTrigger className="h-7 w-36 border-line bg-bg-0 text-xs text-text-1">
                  <CornerDownLeft className="h-3 w-3" />
                  <SelectValue placeholder={t('algos.drawer.insertParam')} />
                </SelectTrigger>
                <SelectContent className="max-h-64 border-line bg-bg-1">
                  {paramOptions.map((p) => (
                    <SelectItem key={p.key} value={p.key} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                      <span className="font-mono">{p.key}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              id="algo-formula"
              ref={formulaRef}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="如 ceil(p * computeRacks * computeTdpKw / ((1 - p) * rackSize * nodeTdpKw))"
              className={cn(
                'border-line bg-bg-0 font-mono text-sm text-text-0 placeholder:text-text-2',
                syntaxError && 'border-red',
                syntaxOk && 'border-green/50',
              )}
            />
            {/* 即時語法檢查 */}
            <motion.div
              key={syntaxOk ? 'ok' : syntaxError ?? 'idle'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-5"
            >
              {debouncedFormula.trim() === '' ? (
                <p className="text-xs text-text-2">{t('algos.drawer.validateIdle')}</p>
              ) : validateQuery.isFetching ? (
                <p className="text-xs text-text-2">{t('algos.drawer.validating')}</p>
              ) : syntaxOk ? (
                <p className="flex items-center gap-1.5 text-xs text-green">
                  <CircleCheck className="h-3.5 w-3.5" />
                  {t('algos.drawer.validateOk')}
                  {formulaVariables.length > 0 && (
                    <span className="text-text-2">
                      {t('algos.drawer.validateVars')}
                      {formulaVariables.map((v) => (
                        <FormulaText key={v} text={v} className="mx-0.5" />
                      ))}
                    </span>
                  )}
                </p>
              ) : syntaxError ? (
                <p className="flex items-center gap-1.5 text-xs text-red">
                  <CircleX className="h-3.5 w-3.5" />
                  ✕ {syntaxError}
                </p>
              ) : null}
            </motion.div>
          </motion.div>

          {/* 變數綁定宣告（由公式自動推導） */}
          {formulaVariables.length > 0 && (
            <motion.div {...fieldMotion(4)} className="flex flex-col gap-1.5">
              <Label className="text-text-1">{t('algos.drawer.varSources')}</Label>
              <div className="divide-y divide-line rounded-lg border border-line bg-bg-0">
                {formulaVariables.map((v) => {
                  const boundKey = bindings[v];
                  const bound = boundKey ? paramMap.get(boundKey) : undefined;
                  return (
                    <div key={v} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <span className="w-28 shrink-0 font-mono text-sm text-accent">{v}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-text-2">
                        {bound?.description ?? '—'}
                      </span>
                      <Select
                        value={boundKey ?? MANUAL}
                        onValueChange={(val) =>
                          setBindings((s) => {
                            const next = { ...s };
                            if (val === MANUAL) delete next[v];
                            else next[v] = val;
                            return next;
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-48 border-line bg-bg-1 text-xs text-text-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 border-line bg-bg-1">
                          <SelectItem value={MANUAL} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                            {t('algos.detail.manual')}
                          </SelectItem>
                          {paramOptions.map((p) => (
                            <SelectItem key={p.key} value={p.key} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                              <span className="font-mono">{p.key}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 即時試算區 */}
          {syntaxOk && (
            <motion.div {...fieldMotion(5)}>
              <TestPanel formula={debouncedFormula} bindings={bindings} paramMap={paramMap} compact />
            </motion.div>
          )}

          {/* 動作列 */}
          <motion.div {...fieldMotion(6)} className="flex justify-end gap-2 border-t border-line pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!canSubmit}
              title={!syntaxOk && formulaChanged ? t('algos.drawer.saveDisabledHint') : undefined}
              onClick={() => void handleSubmit()}
              className="bg-accent text-bg-0 hover:bg-accent/90 hover:shadow-glow"
            >
              <Check className="h-4 w-4" />
              {submitting ? t('algos.drawer.saving') : t('algos.drawer.save')}
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
