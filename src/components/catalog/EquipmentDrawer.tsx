import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormDrawer from './FormDrawer';
import { Field, inputClass } from './fields';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  CATEGORY_META,
  isCoolingCategory,
  urlDomain,
  type EquipmentRow,
} from './catalogMeta';
import type { EquipmentCategory } from './catalogMeta';

// ---------------- zod schema（對齊後端 equipmentInput） ----------------
const emptyToUndef = (v: unknown) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

const equipmentSchema = z.object({
  category: z.enum(EQUIPMENT_CATEGORIES),
  name: z.string().min(1, '請輸入型號名稱').max(191, '型號名稱過長'),
  vendorName: z.string().max(191, '廠商名稱過長').optional(),
  capacityKw: z.coerce.number({ error: '請輸入容量' }).positive('容量需大於 0'),
  peakPowerConsumptionKw: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative('峰值功耗不可為負').optional(),
  ),
  efficiency: z.preprocess(
    emptyToUndef,
    z.coerce.number().min(0, '效率不可小於 0').max(1, '效率需介於 0–1').optional(),
  ),
  heightM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('尺寸不可為負').optional()),
  widthM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('尺寸不可為負').optional()),
  depthM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('尺寸不可為負').optional()),
  accessAreaShare: z.coerce.number().min(0, 'λ 不可小於 0').max(1, 'λ 需介於 0–1'),
  generation: z.preprocess(
    emptyToUndef,
    z.coerce
      .number()
      .int('年份需為整數')
      .min(1950, '年份需介於 1950–2035')
      .max(2035, '年份需介於 1950–2035')
      .optional(),
  ),
  sourceUrl: z
    .string()
    .max(512, 'URL 過長')
    .optional()
    .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), '請輸入有效的 http(s) URL'),
  notes: z.string().optional(),
  engineEligible: z.boolean(),
});

type EquipmentFormValues = z.input<typeof equipmentSchema>;
type EquipmentFormOutput = z.output<typeof equipmentSchema>;

interface EquipmentDrawerProps {
  open: boolean;
  /** 有值 → 編輯模式 */
  row?: EquipmentRow | null;
  /** 初始分類（新增時沿用目前篩選） */
  initialCategory?: EquipmentCategory | 'all';
  vendors: string[];
  onClose: () => void;
  onSaved: (id: number | null, mode: 'create' | 'update') => void;
}

export default function EquipmentDrawer({
  open,
  row,
  initialCategory,
  vendors,
  onClose,
  onSaved,
}: EquipmentDrawerProps) {
  const utils = trpc.useUtils();

  const defaults = useMemo<EquipmentFormValues>(
    () => ({
      category:
        row?.category && (EQUIPMENT_CATEGORIES as readonly string[]).includes(row.category)
          ? (row.category as EquipmentCategory)
          : initialCategory && initialCategory !== 'all'
            ? initialCategory
            : 'cdu',
      name: row?.name ?? '',
      vendorName: row?.vendorName ?? '',
      capacityKw: row?.capacityKw ?? ('' as unknown as number),
      peakPowerConsumptionKw: row?.peakPowerConsumptionKw ?? undefined,
      efficiency: row?.efficiency ?? undefined,
      heightM: row?.heightM ?? undefined,
      widthM: row?.widthM ?? undefined,
      depthM: row?.depthM ?? undefined,
      accessAreaShare: row?.accessAreaShare ?? 0.2,
      generation: row?.generation ? Number(row.generation) : undefined,
      sourceUrl: row?.sourceUrl ?? '',
      notes: row?.notes ?? '',
      engineEligible: row?.engineEligible ?? true,
    }),
    [row, initialCategory],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormValues, unknown, EquipmentFormOutput>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: defaults,
  });

  // 開啟時重置表單
  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const category = watch('category');
  const accessAreaShare = watch('accessAreaShare');
  const sourceUrl = watch('sourceUrl');
  const heightM = watch('heightM');
  const widthM = watch('widthM');
  const depthM = watch('depthM');

  const cooling = isCoolingCategory(category);
  const domain = urlDomain(sourceUrl);

  const createMut = trpc.catalog.create.useMutation({
    onSuccess: async (res) => {
      toast.success('已新增設備');
      await Promise.all([utils.catalog.list.invalidate(), utils.catalog.vendors.invalidate(), utils.stats.get.invalidate()]);
      onSaved(res.id, 'create');
    },
    onError: (e) => toast.error(`新增失敗：${e.message}`),
  });
  const updateMut = trpc.catalog.update.useMutation({
    onSuccess: async () => {
      toast.success('已更新設備');
      await Promise.all([utils.catalog.list.invalidate(), utils.catalog.vendors.invalidate(), utils.stats.get.invalidate()]);
      onSaved(row?.id ?? null, 'update');
    },
    onError: (e) => toast.error(`更新失敗：${e.message}`),
  });

  const onSubmit = handleSubmit(async (parsed) => {
    // 依類別清除不適用欄位
    const payload = {
      name: parsed.name,
      vendorName: parsed.vendorName || null,
      category: parsed.category,
      capacityKw: parsed.capacityKw,
      peakPowerConsumptionKw: cooling ? (parsed.peakPowerConsumptionKw ?? null) : null,
      efficiency: cooling ? null : (parsed.efficiency ?? null),
      heightM: parsed.heightM ?? null,
      widthM: parsed.widthM ?? null,
      depthM: parsed.depthM ?? null,
      accessAreaShare: parsed.accessAreaShare,
      generation: parsed.generation !== undefined ? String(parsed.generation) : null,
      sourceUrl: parsed.sourceUrl || null,
      notes: parsed.notes || null,
      engineEligible: parsed.engineEligible,
    };
    if (row) {
      await updateMut.mutateAsync({ id: row.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  });

  const pending = isSubmitting || createMut.isPending || updateMut.isPending;

  // 尺寸即時預覽比例條
  const dims = [
    { label: 'H', value: Number(heightM) || 0, color: 'bg-accent' },
    { label: 'W', value: Number(widthM) || 0, color: 'bg-cool' },
    { label: 'D', value: Number(depthM) || 0, color: 'bg-violet' },
  ];
  const maxDim = Math.max(...dims.map((d) => d.value), 0.001);
  const hasDim = dims.some((d) => d.value > 0);

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={row ? `編輯設備：${row.name}` : '新增設備'}
      subtitle="規格請依各廠商官方型錄填寫；標 * 為必填。"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button type="submit" form="equipment-form" disabled={pending}>
            {pending ? '儲存中…' : '儲存'}
          </Button>
        </div>
      }
    >
      <form id="equipment-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {/* 分類 */}
        <Field label="分類 *" error={errors.category?.message}>
          <Select
            value={category}
            onValueChange={(v) => setValue('category', v as EquipmentCategory, { shouldValidate: true })}
          >
            <SelectTrigger className={inputClass(!!errors.category)}>
              <SelectValue placeholder="選擇分類" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${CATEGORY_META[c].dot}`} />
                    {EQUIPMENT_CATEGORY_LABELS[c]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* 型號 / 廠商 */}
        <Field label="型號名稱 *" error={errors.name?.message}>
          <input
            className={inputClass(!!errors.name)}
            placeholder="例如：Delta L2L CDU 1200kW"
            {...register('name')}
          />
        </Field>

        <Field label="廠商" error={errors.vendorName?.message} hint="可從清單選擇或直接輸入新廠商">
          <input
            className={inputClass(!!errors.vendorName)}
            placeholder="例如：台達電子 Delta"
            list="catalog-vendor-list"
            {...register('vendorName')}
          />
          <datalist id="catalog-vendor-list">
            {vendors.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Field>

        {/* 容量 */}
        <Field label="容量（kW）*" error={errors.capacityKw?.message}>
          <input
            type="number"
            step="any"
            min={0}
            className={`${inputClass(!!errors.capacityKw)} font-mono`}
            placeholder="例如：1200"
            {...register('capacityKw', { valueAsNumber: true })}
          />
        </Field>

        {/* 依分類動態切換：冷卻類 → 峰值功耗；配電類 → 效率 */}
        {cooling ? (
          <Field label="峰值功耗 Peak Power Consumption（kW）" error={errors.peakPowerConsumptionKw?.message}>
            <input
              type="number"
              step="any"
              min={0}
              className={`${inputClass(!!errors.peakPowerConsumptionKw)} font-mono`}
              placeholder="例如：45"
              {...register('peakPowerConsumptionKw', { valueAsNumber: true })}
            />
          </Field>
        ) : (
          <Field
            label="效率 Efficiency（0–1）"
            error={errors.efficiency?.message}
            hint="例如 0.97 代表 97%"
          >
            <input
              type="number"
              step="any"
              min={0}
              max={1}
              className={`${inputClass(!!errors.efficiency)} font-mono`}
              placeholder="例如：0.97"
              {...register('efficiency', { valueAsNumber: true })}
            />
          </Field>
        )}

        {/* 尺寸 H/W/D + 預覽比例條 */}
        <Field label="尺寸（m）H / W / D">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['heightM', 'H'],
                ['widthM', 'W'],
                ['depthM', 'D'],
              ] as const
            ).map(([key, lbl]) => (
              <div key={key} className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-text-2">
                  {lbl}
                </span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  className={`${inputClass(!!errors[key]?.message)} pl-7 font-mono`}
                  placeholder="0.0"
                  {...register(key, { valueAsNumber: true })}
                />
              </div>
            ))}
          </div>
          {hasDim && (
            <div className="mt-2.5 flex flex-col gap-1.5 rounded-lg border border-line bg-bg-2 p-3">
              {dims.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-3 font-mono text-xs text-text-2">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-3">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-300`}
                      style={{ width: `${Math.max((d.value / maxDim) * 100, d.value > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-xs text-text-1">{d.value} m</span>
                </div>
              ))}
            </div>
          )}
        </Field>

        {/* λ */}
        <Field
          label="λ Access Area Share（維護通道占比，0–1）"
          error={errors.accessAreaShare?.message}
        >
          <div className="flex items-center gap-3">
            <Slider
              className="flex-1"
              min={0}
              max={1}
              step={0.01}
              value={[Number(accessAreaShare) || 0]}
              onValueChange={([v]) => setValue('accessAreaShare', v, { shouldValidate: true })}
            />
            <input
              type="number"
              step={0.01}
              min={0}
              max={1}
              className={`${inputClass(!!errors.accessAreaShare?.message)} w-24 font-mono`}
              {...register('accessAreaShare', { valueAsNumber: true })}
            />
          </div>
        </Field>

        {/* 年份 */}
        <Field label="年份（1950–2035）" error={errors.generation?.message}>
          <input
            type="number"
            step={1}
            min={1950}
            max={2035}
            className={`${inputClass(!!errors.generation?.message)} font-mono`}
            placeholder="例如：2024"
            {...register('generation', { valueAsNumber: true })}
          />
        </Field>

        {/* 來源 URL */}
        <Field label="來源 URL" error={errors.sourceUrl?.message}>
          <input
            className={inputClass(!!errors.sourceUrl?.message)}
            placeholder="https://..."
            {...register('sourceUrl')}
          />
          {domain && !errors.sourceUrl && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-xs text-accent">
              {domain}
            </span>
          )}
        </Field>

        {/* 備註 */}
        <Field label="備註" error={errors.notes?.message}>
          <textarea
            rows={3}
            className={`${inputClass(!!errors.notes?.message)} resize-y`}
            placeholder="並聯上限、重量、認證等補充資訊"
            {...register('notes')}
          />
        </Field>

        {/* engineEligible */}
        <div className="flex items-center justify-between rounded-lg border border-line bg-bg-2 px-4 py-3">
          <div>
            <p className="text-sm text-text-0">納入引擎選型（engineEligible）</p>
            <p className="text-xs text-text-2">關閉後產生器不會選用此設備</p>
          </div>
          <Switch
            checked={watch('engineEligible')}
            onCheckedChange={(v) => setValue('engineEligible', v)}
            aria-label="納入引擎選型"
          />
        </div>
      </form>
    </FormDrawer>
  );
}
