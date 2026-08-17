import { AnimatePresence, motion } from 'framer-motion';
import {
  Cpu,
  Snowflake,
  Zap,
  Settings2,
  RotateCcw,
  Minus,
  Plus,
  Loader2,
  Info,
} from 'lucide-react';
import type { DatacenterType, HeatRejectionMode, OptimizationCriterion } from '@contracts/dcgen';
import { DATACENTER_TYPES, GENERATION_YEARS } from '@contracts/dcgen';
import { trpc } from '@/providers/trpc';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SegmentedControl from '@/components/generator/SegmentedControl';
import RedundancyEditor from '@/components/generator/RedundancyEditor';
import type { FormState } from '@/components/generator/generator-utils';
import { fmt } from '@/components/generator/generator-utils';

const DC_TYPE_KEYS: Record<DatacenterType, string> = {
  'AI training': 'generator.form.type.aiTraining',
  'AI inference': 'generator.form.type.aiInference',
  'Mixed AI training and inference': 'generator.form.type.mixedAi',
  Cloud: 'generator.form.type.cloud',
};

const HEAT_DESC_KEYS: Record<HeatRejectionMode, string> = {
  'Dry cooling': 'generator.form.heatDryDesc',
  'Evaporative cooling': 'generator.form.heatEvapDesc',
};

interface GeneratorFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  paramDefaults: { safetyMargin: number; rackPerRow: number; rowsPerPod: number };
}

function GroupLabel({ icon: Icon, children }: { icon: typeof Cpu; children: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" />
      {children}
    </span>
  );
}

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-xs font-medium text-text-1">{children}</span>
      {hint && (
        <span title={hint}>
          <Info className="h-3 w-3 text-text-2" />
        </span>
      )}
    </div>
  );
}

const inputCls =
  'h-9 w-full rounded-lg border border-line bg-bg-1 px-3 font-mono text-sm text-text-0 transition-colors focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]';

export default function GeneratorForm({
  form,
  onChange,
  onGenerate,
  isGenerating,
  paramDefaults,
}: GeneratorFormProps) {
  const { t } = useI18n();
  // Reference 模式的 IT 配置清單（依類型篩選）
  const itConfigsQuery = trpc.itConfig.list.useQuery(
    { datacenterType: form.datacenterUseCase, model: 'Reference' },
    { enabled: form.model === 'Reference' },
  );
  const refConfigs = itConfigsQuery.data ?? [];

  const toggleRefConfig = (name: string, checked: boolean) => {
    const set = new Set(form.specificDatacenters);
    if (checked) set.add(name);
    else set.delete(name);
    onChange({ specificDatacenters: [...set] });
  };

  const toggleCriterion = (c: OptimizationCriterion) => {
    const has = form.optimizationCriteria.includes(c);
    if (has && form.optimizationCriteria.length === 1) return; // 至少一個
    onChange({
      optimizationCriteria: has
        ? form.optimizationCriteria.filter((x) => x !== c)
        : [...form.optimizationCriteria, c],
    });
  };

  const canGenerate = form.optimizationCriteria.length >= 1 && !isGenerating;

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl border border-line bg-bg-2 lg:sticky lg:top-6"
    >
      <Accordion type="multiple" defaultValue={['a', 'b', 'c']} className="px-5">
        {/* 群組 A · 基本需求 */}
        <AccordionItem value="a" className="border-line">
          <AccordionTrigger className="py-4 text-sm font-medium text-text-0 hover:no-underline">
            <GroupLabel icon={Cpu}>{t('generator.form.groupBasic')}</GroupLabel>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pb-5">
            <div>
              <FieldLabel>{t('generator.form.dcType')}</FieldLabel>
              <SegmentedControl
                id="dc-type"
                value={form.datacenterUseCase}
                onChange={(v) => onChange({ datacenterUseCase: v, specificDatacenters: [] })}
                options={DATACENTER_TYPES.map((ty) => ({ value: ty, label: t(DC_TYPE_KEYS[ty]) }))}
              />
            </div>

            <div>
              <FieldLabel>{t('generator.form.targetMode')}</FieldLabel>
              <SegmentedControl
                id="target-mode"
                value={form.targetMode}
                onChange={(v) => onChange({ targetMode: v })}
                options={[
                  { value: 'racks', label: t('generator.form.targetRacks') },
                  { value: 'power', label: t('generator.form.targetPower') },
                ]}
              />
              <div className="relative mt-2">
                <AnimatePresence mode="wait" initial={false}>
                  {form.targetMode === 'racks' ? (
                    <motion.div
                      key="racks"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={t('generator.form.racksDecrease')}
                          onClick={() => onChange({ rackCount: Math.max(100, form.rackCount - 100) })}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-bg-1 text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          step={100}
                          value={form.rackCount}
                          onChange={(e) => onChange({ rackCount: Math.max(1, Number(e.target.value) || 1) })}
                          className={cn(inputCls, 'text-center')}
                        />
                        <button
                          type="button"
                          aria-label={t('generator.form.racksIncrease')}
                          onClick={() => onChange({ rackCount: form.rackCount + 100 })}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-bg-1 text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-text-2">{t('generator.form.racksStep')}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="power"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={form.powerMw}
                          onChange={(e) => onChange({ powerMw: Math.max(0.1, Number(e.target.value) || 0.1) })}
                          className={cn(inputCls, 'pr-12')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-2">
                          MW
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-text-2">
                        {tpl(t('generator.form.powerFormat'), { mw: form.powerMw })}
                        {form.powerMw >= 1000
                          ? tpl(t('generator.form.powerFormatGw'), { gw: fmt(form.powerMw / 1000, 1) })
                          : ''}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <FieldLabel>{t('generator.form.model')}</FieldLabel>
              <SegmentedControl
                id="model"
                value={form.model}
                onChange={(v) => onChange({ model: v })}
                options={[
                  { value: 'Canonical', label: 'Canonical', title: t('generator.form.modelCanonicalHint') },
                  { value: 'Reference', label: 'Reference', title: t('generator.form.modelReferenceHint') },
                ]}
              />
            </div>

            <AnimatePresence initial={false}>
              {form.model === 'Canonical' ? (
                <motion.div
                  key="canonical"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <FieldLabel>{t('generator.form.generation')}</FieldLabel>
                  <SegmentedControl
                    id="generation"
                    value={form.generation}
                    onChange={(v) => onChange({ generation: v })}
                    options={[...GENERATION_YEARS.map((y) => ({ value: y as string, label: y })), { value: 'All', label: 'All' }]}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="reference"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <FieldLabel hint={t('generator.form.refConfigsHint')}>
                    {t('generator.form.refConfigs')}
                  </FieldLabel>
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-line bg-bg-1 p-2">
                    {itConfigsQuery.isLoading ? (
                      <div className="flex flex-col gap-2 p-1">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-4/5" />
                        <Skeleton className="h-6 w-3/5" />
                      </div>
                    ) : refConfigs.length === 0 ? (
                      <p className="p-2 text-xs text-text-2">{t('generator.form.refConfigsEmpty')}</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {refConfigs.map((c) => {
                          const maxTdp = Math.max(0, ...c.nodeTypes.map((n) => n.rackTdp));
                          const checked = form.specificDatacenters.includes(c.name);
                          return (
                            <label
                              key={c.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-bg-3',
                                checked && 'bg-accent/5',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => toggleRefConfig(c.name, v === true)}
                              />
                              <span className="flex-1 truncate text-text-0">{c.name}</span>
                              <Badge
                                variant="outline"
                                className="shrink-0 border-line font-mono text-[10px] text-text-1"
                              >
                                {fmt(maxTdp, 0)} kW/rack
                              </Badge>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-text-2">
                    {form.specificDatacenters.length === 0
                      ? t('generator.form.refAll')
                      : tpl(t('generator.form.refSelected'), { n: form.specificDatacenters.length })}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <FieldLabel hint={t('generator.form.criteriaHint')}>{t('generator.form.criteria')}</FieldLabel>
              <div className="flex gap-2">
                {(
                  [
                    { value: 'Space', label: t('generator.form.criterionSpace') },
                    { value: 'Power', label: t('generator.form.criterionPower') },
                  ] as const
                ).map((opt) => {
                  const active = form.optimizationCriteria.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCriterion(opt.value)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150',
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent shadow-[0_0_10px_rgba(34,211,238,0.12)]'
                          : 'border-line bg-bg-1 text-text-1 hover:text-text-0',
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 群組 B · 冷卻 */}
        <AccordionItem value="b" className="border-line">
          <AccordionTrigger className="py-4 text-sm font-medium text-text-0 hover:no-underline">
            <GroupLabel icon={Snowflake}>{t('generator.form.groupCooling')}</GroupLabel>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pb-5">
            <div>
              <FieldLabel>{t('generator.form.heatMode')}</FieldLabel>
              <SegmentedControl
                id="heat"
                value={form.heatRejectionMode}
                onChange={(v) => onChange({ heatRejectionMode: v })}
                options={[
                  { value: 'Dry cooling', label: t('generator.form.heatDry') },
                  { value: 'Evaporative cooling', label: t('generator.form.heatEvap') },
                ]}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={form.heatRejectionMode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 text-[11px] text-text-2"
                >
                  {t(HEAT_DESC_KEYS[form.heatRejectionMode])}
                </motion.p>
              </AnimatePresence>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 群組 C · 配電與冗餘 */}
        <AccordionItem value="c" className="border-line">
          <AccordionTrigger className="py-4 text-sm font-medium text-text-0 hover:no-underline">
            <GroupLabel icon={Zap}>{t('generator.form.groupPower')}</GroupLabel>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <FieldLabel hint={t('generator.form.redundancyHint')}>
              {t('generator.form.redundancy')}
            </FieldLabel>
            <RedundancyEditor
              value={form.redundancy}
              onChange={(r) => onChange({ redundancy: r })}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 群組 D · 進階（預設收合） */}
        <AccordionItem value="d" className="border-b-0 border-line">
          <AccordionTrigger className="py-4 text-sm font-medium text-text-0 hover:no-underline">
            <GroupLabel icon={Settings2}>{t('generator.form.groupAdvanced')}</GroupLabel>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pb-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-text-1">{t('generator.form.safetyMargin')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-accent">{fmt(form.safetyMargin * 100, 0)}%</span>
                  <button
                    type="button"
                    title={tpl(t('generator.form.resetToGlobal'), { v: `${fmt(paramDefaults.safetyMargin * 100, 0)}%` })}
                    onClick={() => onChange({ safetyMargin: paramDefaults.safetyMargin })}
                    className="rounded p-0.5 text-text-2 transition-colors hover:text-accent"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[form.safetyMargin]}
                onValueChange={([v]) => onChange({ safetyMargin: v })}
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-text-2">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {(
              [
                { key: 'rackPerRow' as const, label: t('generator.form.rackPerRowLabel'), def: paramDefaults.rackPerRow },
                { key: 'rowsPerPod' as const, label: t('generator.form.rowsPerPodLabel'), def: paramDefaults.rowsPerPod },
              ]
            ).map((f) => (
              <div key={f.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-text-1">{f.label}</span>
                  <button
                    type="button"
                    title={tpl(t('generator.form.resetToGlobal'), { v: f.def })}
                    onClick={() => onChange({ [f.key]: f.def })}
                    className="rounded p-0.5 text-text-2 transition-colors hover:text-accent"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  value={form[f.key]}
                  onChange={(e) => onChange({ [f.key]: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                  className={inputCls}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 產生配置主按鈕 */}
      <div className="border-t border-line p-5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={!canGenerate}
          onClick={onGenerate}
          className={cn(
            'relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg text-sm font-bold transition-all duration-200',
            canGenerate
              ? 'bg-accent text-bg-0 shadow-glow hover:shadow-glow-strong'
              : 'cursor-not-allowed bg-bg-3 text-text-2',
          )}
        >
          {isGenerating && (
            <motion.span
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-150%' }}
              animate={{ x: '450%' }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('generator.form.generating')}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              {t('generator.form.generate')}
            </>
          )}
        </motion.button>
        {form.optimizationCriteria.length === 0 && (
          <p className="mt-2 text-center text-[11px] text-red">{t('generator.form.criteriaRequired')}</p>
        )}
      </div>
    </motion.div>
  );
}
