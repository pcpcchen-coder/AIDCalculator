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
import { KEY_PATTERN } from './types';

export interface CreateParameterInput {
  key: string;
  value: number;
  unit?: string | null;
  category?: string;
  description?: string | null;
}

type ValueKind = 'number' | 'percent' | 'bool';

const KIND_OPTIONS: { value: ValueKind; label: string }[] = [
  { value: 'number', label: '數值' },
  { value: 'percent', label: '百分比' },
  { value: 'bool', label: '布林' },
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
    if (!KEY_PATTERN.test(fullKey)) return 'key 僅能包含英數與底線，且不得以數字開頭';
    if (existingKeys.includes(fullKey)) return '此 key 已存在';
    return null;
  }, [fullKey, existingKeys]);

  const parsedValue = kind === 'bool' ? (boolValue ? 1 : 0) : Number(valueDraft);
  const valueError =
    kind !== 'bool' && valueDraft.trim() !== '' && (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue))
      ? '請輸入有效數值'
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
      toast.error(e instanceof Error ? e.message : '新增失敗');
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
          <SheetTitle className="text-text-0">新增自訂參數</SheetTitle>
          <SheetDescription className="text-text-1">
            自訂參數歸類於「自訂」，可在自訂算法公式中以 key 引用。
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
              <p className="font-mono text-xs text-text-2">完整 key：{fullKey}</p>
            ) : (
              <p className="text-xs text-text-2">小寫英文、數字與底線；自動加上 custom_ 前綴</p>
            )}
          </motion.div>

          {/* 中文名稱 */}
          <motion.div {...fieldMotion(1)} className="flex flex-col gap-1.5">
            <Label htmlFor="param-name" className="text-text-1">
              中文名稱 <span className="text-red">*</span>
            </Label>
            <Input
              id="param-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：儲存功率占比上限"
              className="border-line bg-bg-0 text-text-0 placeholder:text-text-2"
            />
          </motion.div>

          {/* 型態 Segmented */}
          <motion.div {...fieldMotion(2)} className="flex flex-col gap-1.5">
            <Label className="text-text-1">型態</Label>
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
                  <span className="relative">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 預設值＋單位 */}
          <motion.div {...fieldMotion(3)} className="flex flex-col gap-1.5">
            <Label className="text-text-1">
              預設值 <span className="text-red">*</span>
            </Label>
            {kind === 'bool' ? (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-0 px-3 py-2.5">
                <Switch checked={boolValue} onCheckedChange={setBoolValue} />
                <span className="font-mono text-sm text-text-1">{boolValue ? '啟用（1）' : '停用（0）'}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    value={valueDraft}
                    onChange={(e) => setValueDraft(e.target.value)}
                    placeholder={kind === 'percent' ? '如 4.2' : '如 0.2'}
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
                    placeholder="如 kW、%、m²"
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
            <Label className="text-text-1">分類</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-line bg-bg-0 text-text-0">
                <SelectValue placeholder="選擇分類" />
              </SelectTrigger>
              <SelectContent className="border-line bg-bg-1">
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c} className="text-text-0 focus:bg-bg-3 focus:text-text-0">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-2">預設歸類於「自訂參數」，也可掛到既有分類</p>
          </motion.div>

          {/* 說明 */}
          <motion.div {...fieldMotion(5)} className="flex flex-col gap-1.5">
            <Label htmlFor="param-desc" className="text-text-1">
              說明（選填）
            </Label>
            <Textarea
              id="param-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="此參數的用途、引用位置（式號）等"
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
              取消
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="bg-accent text-bg-0 hover:bg-accent/90 hover:shadow-glow"
            >
              {submitting ? '新增中…' : '新增參數'}
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
