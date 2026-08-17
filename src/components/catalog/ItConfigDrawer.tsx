import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  DATACENTER_TYPES,
  DC_TYPE_I18N_KEYS,
  fmtNum,
  type ItConfigRow,
} from './catalogMeta';
import type { DatacenterType } from './catalogMeta';
import { NODE_TYPES, GENERATION_YEARS } from '@contracts/dcgen';
import type { NodeType } from '@contracts/dcgen';
import { useI18n, tpl } from '@/i18n';

// ---------------- zod schema（對齊後端 itConfigInput；訊息為 i18n key，顯示時經 t() 查表） ----------------
const nodeSchema = z.object({
  nodeType: z.enum(NODE_TYPES),
  rackCount: z.coerce
    .number({ error: 'catalog.err.rackCountRequired' })
    .int('catalog.err.rackCountInt')
    .nonnegative('catalog.err.rackCountNonneg'),
  rackTdp: z.coerce
    .number({ error: 'catalog.err.tdpRequired' })
    .nonnegative('catalog.err.tdpNonneg'),
});

const itConfigSchema = z.object({
  name: z.string().min(1, 'catalog.err.configNameRequired').max(191, 'catalog.err.configNameTooLong'),
  datacenterType: z.enum(DATACENTER_TYPES),
  model: z.enum(['Canonical', 'Reference']),
  generation: z.string().min(1, 'catalog.err.generationRequired'),
  rackSize: z.coerce
    .number({ error: 'catalog.err.rackSizeRequired' })
    .int('catalog.err.rackSizeInt')
    .positive('catalog.err.rackSizePositive'),
  rackType: z.enum(['Cloud', 'HPC']),
  floorSpace: z.coerce
    .number({ error: 'catalog.err.floorSpaceRequired' })
    .positive('catalog.err.floorSpacePositive'),
  sourceUrl: z
    .string()
    .max(512, 'catalog.err.urlTooLong')
    .optional()
    .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), 'catalog.err.urlInvalid'),
  notes: z.string().optional(),
  nodeTypes: z.array(nodeSchema).min(1, 'catalog.err.nodeMin'),
});

type ItConfigFormValues = z.input<typeof itConfigSchema>;
type ItConfigFormOutput = z.output<typeof itConfigSchema>;

interface ItConfigDrawerProps {
  open: boolean;
  row?: ItConfigRow | null;
  onClose: () => void;
  onSaved: (mode: 'create' | 'update') => void;
}

export default function ItConfigDrawer({ open, row, onClose, onSaved }: ItConfigDrawerProps) {
  const { t } = useI18n();
  const utils = trpc.useUtils();

  /** zod 訊息（i18n key）→ 譯文 */
  const errMsg = (m?: string): string | undefined => (m ? t(m) : undefined);

  const defaults = useMemo<ItConfigFormValues>(
    () => ({
      name: row?.name ?? '',
      datacenterType:
        row?.datacenterType && (DATACENTER_TYPES as readonly string[]).includes(row.datacenterType)
          ? (row.datacenterType as DatacenterType)
          : 'AI training',
      model: row?.model === 'Reference' ? 'Reference' : 'Canonical',
      generation: row?.generation ?? '2024',
      rackSize: row?.rackSize ?? 42,
      rackType: row?.rackType === 'HPC' ? 'HPC' : 'Cloud',
      floorSpace: row?.floorSpace ?? ('' as unknown as number),
      sourceUrl: row?.sourceUrl ?? '',
      notes: row?.notes ?? '',
      nodeTypes:
        row?.nodeTypes.map((n) => ({
          nodeType: (NODE_TYPES as readonly string[]).includes(n.nodeType)
            ? (n.nodeType as NodeType)
            : 'GPU',
          rackCount: n.rackCount,
          rackTdp: n.rackTdp,
        })) ?? [{ nodeType: 'GPU' as NodeType, rackCount: 0, rackTdp: 0 }],
    }),
    [row],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItConfigFormValues, unknown, ItConfigFormOutput>({
    resolver: zodResolver(itConfigSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'nodeTypes' });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const nodeTypes = watch('nodeTypes');
  const datacenterType = watch('datacenterType');
  const model = watch('model');
  const generation = watch('generation');
  const rackType = watch('rackType');

  // 即時合計
  const totals = useMemo(() => {
    let racks = 0;
    let kw = 0;
    for (const n of nodeTypes ?? []) {
      const rc = Number(n?.rackCount) || 0;
      const tdp = Number(n?.rackTdp) || 0;
      racks += rc;
      kw += rc * tdp;
    }
    return { racks, kw };
  }, [nodeTypes]);

  const createMut = trpc.itConfig.create.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.createIt'));
      await Promise.all([utils.itConfig.list.invalidate(), utils.stats.get.invalidate()]);
      onSaved('create');
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.createFailed'), { msg: e.message })),
  });
  const updateMut = trpc.itConfig.update.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.updateIt'));
      await utils.itConfig.list.invalidate();
      onSaved('update');
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.updateFailed'), { msg: e.message })),
  });

  const onSubmit = handleSubmit(async (parsed) => {
    const payload = {
      name: parsed.name,
      datacenterType: parsed.datacenterType,
      model: parsed.model,
      generation: parsed.generation,
      rackSize: parsed.rackSize,
      rackType: parsed.rackType,
      floorSpace: parsed.floorSpace,
      sourceUrl: parsed.sourceUrl || null,
      notes: parsed.notes || null,
      nodeTypes: parsed.nodeTypes,
    };
    if (row) {
      await updateMut.mutateAsync({ id: row.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  });

  const pending = isSubmitting || createMut.isPending || updateMut.isPending;

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={row ? tpl(t('catalog.itdrawer.editTitle'), { name: row.name }) : t('catalog.itdrawer.addTitle')}
      subtitle={t('catalog.itdrawer.subtitle')}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs text-text-1">
            {t('catalog.itdrawer.totalRacks')} <span className="text-text-0">{fmtNum(totals.racks)}</span> · {t('catalog.itdrawer.totalPower')}{' '}
            <span className="text-accent">{fmtNum(totals.kw, 1)} kW</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="itconfig-form" disabled={pending}>
              {pending ? t('catalog.drawer.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <form id="itconfig-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {/* 名稱 */}
        <Field label={t('catalog.iform.name')} error={errMsg(errors.name?.message)}>
          <input
            className={inputClass(!!errors.name)}
            placeholder={t('catalog.iform.namePlaceholder')}
            {...register('name')}
          />
        </Field>

        {/* DC 類型 */}
        <Field label={t('catalog.iform.dcType')} error={errMsg(errors.datacenterType?.message)}>
          <Select
            value={datacenterType}
            onValueChange={(v) => setValue('datacenterType', v as DatacenterType, { shouldValidate: true })}
          >
            <SelectTrigger className={inputClass(!!errors.datacenterType)}>
              <SelectValue placeholder={t('catalog.iform.dcTypePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {DATACENTER_TYPES.map((dc) => (
                <SelectItem key={dc} value={dc}>
                  {t(DC_TYPE_I18N_KEYS[dc])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* 來源 radio */}
        <Field label={t('catalog.iform.model')} error={errMsg(errors.model?.message)}>
          <div className="grid grid-cols-2 gap-2">
            {(['Canonical', 'Reference'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('model', m, { shouldValidate: true })}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm transition-all',
                  model === m
                    ? m === 'Canonical'
                      ? 'border-accent/60 bg-accent/10 text-accent shadow-glow'
                      : 'border-violet/60 bg-violet/10 text-violet'
                    : 'border-line bg-bg-1 text-text-1 hover:text-text-0',
                )}
              >
                {m === 'Canonical' ? t('catalog.model.canonical') : t('catalog.model.reference')}
              </button>
            ))}
          </div>
        </Field>

        {/* 年份 / RackSize */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('catalog.iform.generation')} error={errMsg(errors.generation?.message)}>
            <Select value={generation} onValueChange={(v) => setValue('generation', v, { shouldValidate: true })}>
              <SelectTrigger className={inputClass(!!errors.generation)}>
                <SelectValue placeholder={t('catalog.iform.generationPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {GENERATION_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('catalog.iform.rackSize')} error={errMsg(errors.rackSize?.message)}>
            <input
              type="number"
              step={1}
              min={1}
              className={`${inputClass(!!errors.rackSize?.message)} font-mono`}
              placeholder="42"
              {...register('rackSize', { valueAsNumber: true })}
            />
          </Field>
        </div>

        {/* RackType / floorSpace */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('catalog.iform.rackType')} error={errMsg(errors.rackType?.message)}>
            <Select
              value={rackType}
              onValueChange={(v) => setValue('rackType', v as 'Cloud' | 'HPC', { shouldValidate: true })}
            >
              <SelectTrigger className={inputClass(!!errors.rackType)}>
                <SelectValue placeholder={t('catalog.iform.rackTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cloud">Cloud（{t('catalog.rackType.Cloud')}）</SelectItem>
                <SelectItem value="HPC">HPC（{t('catalog.rackType.HPC')}）</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('catalog.iform.floorSpace')} error={errMsg(errors.floorSpace?.message)}>
            <input
              type="number"
              step="any"
              min={0}
              className={`${inputClass(!!errors.floorSpace?.message)} font-mono`}
              placeholder={t('catalog.iform.floorSpacePlaceholder')}
              {...register('floorSpace', { valueAsNumber: true })}
            />
          </Field>
        </div>

        {/* Node types 動態清單 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-text-1">{t('catalog.iform.nodeTypes')}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-line bg-bg-1 text-text-1 hover:text-accent"
              onClick={() => append({ nodeType: 'GPU', rackCount: 0, rackTdp: 0 })}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('catalog.iform.addNode')}
            </Button>
          </div>
          {errors.nodeTypes?.root?.message && (
            <p className="mb-2 text-xs text-red">{errMsg(errors.nodeTypes.root.message)}</p>
          )}
          {typeof errors.nodeTypes?.message === 'string' && (
            <p className="mb-2 text-xs text-red">{errMsg(errors.nodeTypes.message)}</p>
          )}
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {fields.map((field, i) => (
                <motion.div
                  key={field.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.97, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.97, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-[1fr_88px_96px_36px] items-start gap-2 rounded-lg border border-line bg-bg-2 p-2.5">
                    <Select
                      value={nodeTypes?.[i]?.nodeType ?? 'GPU'}
                      onValueChange={(v) =>
                        setValue(`nodeTypes.${i}.nodeType`, v as NodeType, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className={inputClass(!!errors.nodeTypes?.[i]?.nodeType)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_TYPES.map((nt) => (
                          <SelectItem key={nt} value={nt}>
                            {t(`catalog.nodeType.${nt}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <input
                        type="number"
                        step={1}
                        min={0}
                        placeholder={t('catalog.iform.rackCountPlaceholder')}
                        aria-label="rackCount"
                        className={`${inputClass(!!errors.nodeTypes?.[i]?.rackCount)} font-mono`}
                        {...register(`nodeTypes.${i}.rackCount`, { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="TDP kW"
                        aria-label="rackTdp"
                        className={`${inputClass(!!errors.nodeTypes?.[i]?.rackTdp)} font-mono`}
                        {...register(`nodeTypes.${i}.rackTdp`, { valueAsNumber: true })}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={t('catalog.iform.removeNode')}
                      onClick={() => remove(i)}
                      disabled={fields.length <= 1}
                      className="mt-1 rounded-lg p-2 text-text-2 transition-colors hover:bg-bg-1 hover:text-red disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {(errors.nodeTypes?.[i]?.rackCount || errors.nodeTypes?.[i]?.rackTdp) && (
                      <p className="col-span-4 text-xs text-red">
                        {errMsg(
                          errors.nodeTypes?.[i]?.rackCount?.message ??
                            errors.nodeTypes?.[i]?.rackTdp?.message,
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 來源 URL */}
        <Field label={t('catalog.form.sourceUrl')} error={errMsg(errors.sourceUrl?.message)}>
          <input
            className={inputClass(!!errors.sourceUrl?.message)}
            placeholder="https://..."
            {...register('sourceUrl')}
          />
        </Field>

        {/* 備註 */}
        <Field label={t('catalog.form.notes')} error={errMsg(errors.notes?.message)}>
          <textarea
            rows={3}
            className={`${inputClass(!!errors.notes?.message)} resize-y`}
            placeholder={t('catalog.iform.notesPlaceholder')}
            {...register('notes')}
          />
        </Field>
      </form>
    </FormDrawer>
  );
}
