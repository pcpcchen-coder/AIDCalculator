import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { KEY_PATTERN, categoryLabel } from './types';

export interface CreateParameterInput {
  key: string;
  value: number;
  unit?: string | null;
  category?: string;
  description?: string | null;
}

type ValueKind = 'number' | 'percent' | 'bool';

const KIND_OPTIONS: { value: ValueKind; labelKey: string }[] = [
  { value: 'number', labelKey: 'params.create.kind.number' },
  { value: 'percent', labelKey: 'params.create.kind.percent' },
  { value: 'bool', labelKey: 'params.create.kind.bool' },
];

interface CreateParameterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingKeys: string[];
  categories: string[];
  onCreate: (input: CreateParameterInput) => Promise<void>;
}

const fieldMotion = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const, delay: 0.05 + i * 0.04 },
});

/** 新增自訂參數右側抽屜（440px） */
export default function CreateParameterDrawer({
  open,
  onOpenChange,
  existingKeys,
  categories,
  onCreate,
}: CreateParameterDrawerProps) {
  const { t } = useI18n();
  const [suffix, setSuffix] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ValueKind>('number');
  const [valueDraft, setValueDraft] = useState('');
  const [boolValue, setBoolValue] = useState(true);
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('自訂參數');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSuffix('');
      setName('');
      setKind('number');
      setValueDraft('');
      setBoolValue(true);
      setUnit('');
      setCategory('自訂參數');
      setDescription('');
    }
  }, [open]);

  const fullKey = useMemo(() => {
    const clean = suffix.trim().replace(/^custom_/, '');
    return clean ? `custom_${clean}` : '';
  }, [suffix]);

  const keyError = useMemo(() => {
    if (!fullKey) return null;
    if (!KEY_PATTERN.test(fullKey)) return t('params.err.keyPattern');
    if (existingKeys.includes(fullKey)) return t('params.err.keyExists');
    return null;
  }, [fullKey, existingKeys, t]);

  const parsedValue = kind === 'bool' ? (boolValue ? 1 : 0) : Number(valueDraft);
  const valueError =
    kind !== 'bool' && valueDraft.trim() !== '' && (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue))
      ? t('params.err.invalidNumber')
      : null;

  const canSubmit =
    fullKey !== '' && !keyError && name.trim() !== '' && !valueError &&
    (kind === 'bool' || valueDraft.trim() !== '') && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const finalUnit = kind === 'percent' ? '%' : kind === 'bool' ? 'bool' : unit.trim() || null;
      const desc = description.trim()
        ? `${name.trim()}：${description.trim()}`
        : name.trim();
      await onCreate({
        key: fullKey,
        value: parsedValue,
        unit: finalUnit,
        category: category || '自訂參數',
        description: desc,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('params.err.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const allCategories = useMemo(() => {
    const set = new Set(categories);
    set.add('自訂參數');
    return [...set];
  }, [categories]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-line bg-bg-1 sm:max-w-[440px]"
      >
        <SheetHeader>
          <SheetTitle className="text-text-0">{t('params.create.drawer')}</SheetTitle>
          <SheetDescription className="text-text-1">
            {t('params.create.desc')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 flex flex-col gap-5 px-4 pb-6">
          {/* Key */}
          <motion.div {...fieldMotion(0)} className="flex flex-col gap-1.5">
            <Label htmlFor="param-key" className="text-text-1">
              Key <span className="text-red">*</span>
            </Label>
            <div
              className={cn(
                'flex items-center rounded-lg border bg-bg-0 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]',
                keyError ? 'border-red' : 'border-line focus-within:border-accent',
              )}
            >
              <span className="border-r border-line px-3 font-mono text-sm text-text-2">custom_</span>
              <input
                id="param-key"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="my_threshold"
                className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-text-0 outline-none placeholder:text-text-2"
              />
            </div>
            {keyError ? (
              <p className="text-xs text-red">{keyError}</p>
            ) : fullKey ? (
              <p className="font-mono text-xs text-text-2">{tpl(t('params.create.fullKey'), { key: fullKey })}</p>
            ) : (
              <p className="text-xs text-text-2">{t('params.create.keyHint')}</p>
            )}
          </motion.div>

          {/* 中文名稱 */}
          <motion.div {...fieldMotion(1)} className="flex flex-col gap-1.5">
            <Label htmlFor="param-name" className="text-text-1">
              {t('params.create.name')} <span className="text-red">*</span>
            </Label>
            <Input
              id="param-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('params.create.namePlaceholder')}
              className="border-line bg-bg-0 text-text-0 placeholder:text-text-2"
            />
          </motion.div>

          {/* 型態 Segmented */}
          <motion.div {...fieldMotion(2)} className="flex flex-col gap-1.5">
            <Label className="text-text-1">{t('params.create.kind')}</Label>
            <div className="flex rounded-full border border-line bg-bg-0 p-1">
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={cn(
                    'relative flex-1 rounded-full px-3 py-1.5 text-sm transition-colors',
                    kind === opt.value ? 'text-accent' : 'text-text-1 hover:text-text-0',
                  )}
                >
                  {kind === opt.value && (
                    <motion.span
                      layoutId="param-kind-pill"
                      className="absolute inset-0 rounded-full bg-bg-2 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <span className="relative">{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 預設值＋單位 */}
          <motion.div {...fieldMotion(3)} className="flex flex-col gap-1.5">
            <Label className="text-text-1">
              {t('params.create.defaultValue')} <span className="text-red">*</span>
            </Label>
            {kind === 'bool' ? (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-0 px-3 py-2.5">
                <Switch checked={boolValue} onCheckedChange={setBoolValue} />
                <span className="font-mono text-sm text-text-1">{boolValue ? t('params.create.boolOn') : t('params.create.boolOff')}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    value={valueDraft}
                    onChange={(e) => setValueDraft(e.target.value)}
                    placeholder={kind === 'percent' ? t('params.create.percentPlaceholder') : t('params.create.valuePlaceholder')}
                    inputMode="decimal"
                    className={cn(
                      'border-line bg-bg-0 font-mono text-text-0 placeholder:text-text-2',
                      valueError && 'border-red',
                    )}
                  />
                </div>
                {kind === 'number' && (
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t('params.create.unitPlaceholder')}
                    className="w-32 border-line bg-bg-0 font-mono text-text-0 placeholder:text-text-2"
                  />
                )}
                {kind === 'percent' && (
                  <span className="flex items-center rounded-lg border border-line bg-bg-0 px-3 font-mono text-sm text-text-2">
                    %
                  </span>
                )}
              </div>
            )}
            {valueError && <p className="text-xs text-red">{valueError}</p>}
          </motion.div>

          {/* 分類 */}
          <motion.div {...fieldMotion(4)} className="flex flex-col gap-1.5">
            <Label className="text-text-1">{t('params.create.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-line bg-bg-0 text-text-0">
                <SelectValue placeholder={t('params.create.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="border-line bg-bg-1">
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                    {categoryLabel(t, c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-2">{t('params.create.categoryHint')}</p>
          </motion.div>

          {/* 說明 */}
          <motion.div {...fieldMotion(5)} className="flex flex-col gap-1.5">
            <Label htmlFor="param-desc" className="text-text-1">
              {t('params.create.description')}
            </Label>
            <Textarea
              id="param-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('params.create.descPlaceholder')}
              rows={3}
              className="border-line bg-bg-0 text-text-0 placeholder:text-text-2"
            />
          </motion.div>

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
              onClick={() => void handleSubmit()}
              className="bg-accent text-bg-0 hover:bg-accent/90 hover:shadow-glow"
            >
              {submitting ? t('params.create.submitting') : t('params.create.submit')}
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
