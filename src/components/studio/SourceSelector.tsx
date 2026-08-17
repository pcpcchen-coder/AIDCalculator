import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Database, Loader2 } from 'lucide-react';
import type { GenerateResult, OptimizationCriterion } from '@contracts/dcgen';
import { trpc } from '@/providers/trpc';
import { useI18n } from '@/i18n';
import SegmentedControl from '@/components/generator/SegmentedControl';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SourceSelectorProps {
  designId: number | null;
  onDesignChange: (id: number) => void;
  configIdx: number;
  onConfigChange: (idx: number) => void;
  criterion: OptimizationCriterion;
  onCriterionChange: (c: OptimizationCriterion) => void;
  result: GenerateResult | null;
  designLoading: boolean;
}

/** A. 來源選擇器：已存情境 → 配置 → 優化目標 */
export default function SourceSelector({
  designId,
  onDesignChange,
  configIdx,
  onConfigChange,
  criterion,
  onCriterionChange,
  result,
  designLoading,
}: SourceSelectorProps) {
  const { t } = useI18n();
  const listQuery = trpc.designs.list.useQuery();
  const designs = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const configs = result?.results ?? [];
  const availableCriteria = useMemo<OptimizationCriterion[]>(() => {
    const dc = configs[configIdx];
    return dc ? dc.nonIt.map((n) => n.criterion) : [];
  }, [configs, configIdx]);

  return (
    <section className="mb-6 rounded-xl border border-line bg-bg-1 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-text-0">{t('studio.source.title')}</h2>
        {designLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-2" />}
      </div>
      <p className="mb-4 text-xs text-text-2">{t('studio.source.desc')}</p>

      {listQuery.isSuccess && designs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-bg-0 p-6 text-center">
          <p className="text-sm font-medium text-text-0">{t('studio.source.noDesigns')}</p>
          <p className="mt-1 text-xs text-text-2">{t('studio.source.noDesignsDesc')}</p>
          <Link
            to="/generator"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {t('studio.source.goGenerator')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-text-1">{t('studio.source.designLabel')}</Label>
            <Select
              value={designId != null ? String(designId) : undefined}
              onValueChange={(v) => onDesignChange(Number(v))}
            >
              <SelectTrigger className="border-line bg-bg-0 text-text-0">
                <SelectValue placeholder={t('studio.source.designPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {designs.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {designId == null && listQuery.isSuccess && (
              <p className="text-[11px] text-text-2">{t('studio.source.selectHint')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-1">{t('studio.source.configLabel')}</Label>
            <Select
              value={configs.length ? String(configIdx) : undefined}
              onValueChange={(v) => onConfigChange(Number(v))}
              disabled={configs.length === 0}
            >
              <SelectTrigger className="border-line bg-bg-0 text-text-0">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {configs.map((c, i) => (
                  <SelectItem key={`${c.configName}-${i}`} value={String(i)}>
                    {c.configName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-1">{t('studio.source.criterionLabel')}</Label>
            <SegmentedControl
              id="studio-criterion"
              size="sm"
              value={criterion}
              onChange={onCriterionChange}
              options={([
                { value: 'Space' as const, label: t('studio.source.criterionSpace') },
                { value: 'Power' as const, label: t('studio.source.criterionPower') },
              ]).map((o) => ({
                ...o,
                disabled: availableCriteria.length > 0 && !availableCriteria.includes(o.value),
              }))}
            />
          </div>
        </div>
      )}
    </section>
  );
}
