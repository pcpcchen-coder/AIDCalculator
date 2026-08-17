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
  CATEGORY_META,
  isCoolingCategory,
  urlDomain,
  type EquipmentRow,
} from './catalogMeta';
import type { EquipmentCategory } from './catalogMeta';
import { useI18n, tpl } from '@/i18n';

// ---------------- zod schema（對齊後端 equipmentInput；訊息為 i18n key，顯示時經 t() 查表） ----------------
const emptyToUndef = (v: unknown) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

const equipmentSchema = z.object({
  category: z.enum(EQUIPMENT_CATEGORIES),
  name: z.string().min(1, 'catalog.err.nameRequired').max(191, 'catalog.err.nameTooLong'),
  vendorName: z.string().max(191, 'catalog.err.vendorTooLong').optional(),
  capacityKw: z.coerce.number({ error: 'catalog.err.capacityRequired' }).positive('catalog.err.capacityPositive'),
  peakPowerConsumptionKw: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative('catalog.err.peakNonneg').optional(),
  ),
  efficiency: z.preprocess(
    emptyToUndef,
    z.coerce.number().min(0, 'catalog.err.effMin').max(1, 'catalog.err.effMax').optional(),
  ),
  heightM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('catalog.err.dimNonneg').optional()),
  widthM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('catalog.err.dimNonneg').optional()),
  depthM: z.preprocess(emptyToUndef, z.coerce.number().nonnegative('catalog.err.dimNonneg').optional()),
  accessAreaShare: z.coerce.number().min(0, 'catalog.err.lambdaMin').max(1, 'catalog.err.lambdaMax'),
  generation: z.preprocess(
    emptyToUndef,
    z.coerce
      .number()
      .int('catalog.err.yearInt')
      .min(1950, 'catalog.err.yearRange')
      .max(2035, 'catalog.err.yearRange')
      .optional(),
  ),
  sourceUrl: z
    .string()
    .max(512, 'catalog.err.urlTooLong')
    .optional()
    .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), 'catalog.err.urlInvalid'),
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
  const { t } = useI18n();
  const utils = trpc.useUtils();

  /** zod 訊息（i18n key）→ 譯文 */
  const errMsg = (m?: string): string | undefined => (m ? t(m) : undefined);

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
      toast.success(t('catalog.toast.createEquipment'));
      await Promise.all([utils.catalog.list.invalidate(), utils.catalog.vendors.invalidate(), utils.stats.get.invalidate()]);
      onSaved(res.id, 'create');
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.createFailed'), { msg: e.message })),
  });
  const updateMut = trpc.catalog.update.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.updateEquipment'));
      await Promise.all([utils.catalog.list.invalidate(), utils.catalog.vendors.invalidate(), utils.stats.get.invalidate()]);
      onSaved(row?.id ?? null, 'update');
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.updateFailed'), { msg: e.message })),
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
      title={row ? tpl(t('catalog.drawer.editTitle'), { name: row.name }) : t('catalog.drawer.addTitle')}
      subtitle={t('catalog.drawer.subtitle')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="equipment-form" disabled={pending}>
            {pending ? t('catalog.drawer.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="equipment-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {/* 分類 */}
        <Field label={t('catalog.form.category')} error={errMsg(errors.category?.message)}>
          <Select
            value={category}
            onValueChange={(v) => setValue('category', v as EquipmentCategory, { shouldValidate: true })}
          >
            <SelectTrigger className={inputClass(!!errors.category)}>
              <SelectValue placeholder={t('catalog.form.categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${CATEGORY_META[c].dot}`} />
                    {t(`catalog.category.${c}`)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* 型號 / 廠商 */}
        <Field label={t('catalog.form.name')} error={errMsg(errors.name?.message)}>
          <input
            className={inputClass(!!errors.name)}
            placeholder={t('catalog.form.namePlaceholder')}
            {...register('name')}
          />
        </Field>

        <Field label={t('catalog.form.vendor')} error={errMsg(errors.vendorName?.message)} hint={t('catalog.form.vendorHint')}>
          <input
            className={inputClass(!!errors.vendorName)}
            placeholder={t('catalog.form.vendorPlaceholder')}
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
        <Field label={t('catalog.form.capacity')} error={errMsg(errors.capacityKw?.message)}>
          <input
            type="number"
            step="any"
            min={0}
            className={`${inputClass(!!errors.capacityKw)} font-mono`}
            placeholder={t('catalog.form.capacityPlaceholder')}
            {...register('capacityKw', { valueAsNumber: true })}
          />
        </Field>

        {/* 依分類動態切換：冷卻類 → 峰值功耗；配電類 → 效率 */}
        {cooling ? (
          <Field label={t('catalog.form.peakPower')} error={errMsg(errors.peakPowerConsumptionKw?.message)}>
            <input
              type="number"
              step="any"
              min={0}
              className={`${inputClass(!!errors.peakPowerConsumptionKw)} font-mono`}
              placeholder={t('catalog.form.peakPlaceholder')}
              {...register('peakPowerConsumptionKw', { valueAsNumber: true })}
            />
          </Field>
        ) : (
          <Field
            label={t('catalog.form.efficiency')}
            error={errMsg(errors.efficiency?.message)}
            hint={t('catalog.form.effHint')}
          >
            <input
              type="number"
              step="any"
              min={0}
              max={1}
              className={`${inputClass(!!errors.efficiency)} font-mono`}
              placeholder={t('catalog.form.effPlaceholder')}
              {...register('efficiency', { valueAsNumber: true })}
            />
          </Field>
        )}

        {/* 尺寸 H/W/D + 預覽比例條 */}
        <Field label={t('catalog.form.dims')}>
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
          label={t('catalog.form.lambda')}
          error={errMsg(errors.accessAreaShare?.message)}
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
        <Field label={t('catalog.form.generation')} error={errMsg(errors.generation?.message)}>
          <input
            type="number"
            step={1}
            min={1950}
            max={2035}
            className={`${inputClass(!!errors.generation?.message)} font-mono`}
            placeholder={t('catalog.form.generationPlaceholder')}
            {...register('generation', { valueAsNumber: true })}
          />
        </Field>

        {/* 來源 URL */}
        <Field label={t('catalog.form.sourceUrl')} error={errMsg(errors.sourceUrl?.message)}>
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
        <Field label={t('catalog.form.notes')} error={errMsg(errors.notes?.message)}>
          <textarea
            rows={3}
            className={`${inputClass(!!errors.notes?.message)} resize-y`}
            placeholder={t('catalog.form.notesPlaceholder')}
            {...register('notes')}
          />
        </Field>

        {/* engineEligible */}
        <div className="flex items-center justify-between rounded-lg border border-line bg-bg-2 px-4 py-3">
          <div>
            <p className="text-sm text-text-0">{t('catalog.form.engineEligible')}</p>
            <p className="text-xs text-text-2">{t('catalog.form.engineEligibleHint')}</p>
          </div>
          <Switch
            checked={watch('engineEligible')}
            onCheckedChange={(v) => setValue('engineEligible', v)}
            aria-label={t('catalog.form.engineEligible')}
          />
        </div>
      </form>
    </FormDrawer>
  );
}
