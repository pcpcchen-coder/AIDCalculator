import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import type { GenerateResult, OptimizationCriterion } from '@contracts/dcgen';
import { trpc } from '@/providers/trpc';
import { tpl, useI18n } from '@/i18n';
import { buildLayoutModel, type EquipmentDims } from '@/lib/layoutModel';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import FloorPlan from '@/components/diagrams/FloorPlan';
import ElectricalDiagram from '@/components/diagrams/ElectricalDiagram';
import CoolingDiagram from '@/components/diagrams/CoolingDiagram';
import DatacenterScene from '@/components/studio3d/DatacenterScene';
import SourceSelector from '@/components/studio/SourceSelector';
import InfoBar from '@/components/studio/InfoBar';
import PlacementEditor from '@/components/studio/PlacementEditor';

type TabKey = 'floorplan' | 'scene3d' | 'electrical' | 'cooling' | 'editor';

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'floorplan', labelKey: 'studio.tabs.floorplan' },
  { key: 'scene3d', labelKey: 'studio.tabs.scene3d' },
  { key: 'electrical', labelKey: 'studio.tabs.electrical' },
  { key: 'cooling', labelKey: 'studio.tabs.cooling' },
  { key: 'editor', labelKey: 'studio.tabs.editor' },
];

export default function LayoutStudio() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  // 支援 URL query ?design=<id> 自動帶入
  const [designId, setDesignId] = useState<number | null>(() => {
    const q = searchParams.get('design');
    const n = q ? Number(q) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const [configIdx, setConfigIdx] = useState(0);
  const [criterion, setCriterion] = useState<OptimizationCriterion>('Space');
  const [tab, setTab] = useState<TabKey>('floorplan');

  const designQuery = trpc.designs.get.useQuery(
    { id: designId ?? 0 },
    { enabled: designId != null, retry: false },
  );
  const result = useMemo(
    () => (designQuery.data ? (designQuery.data.result as GenerateResult) : null),
    [designQuery.data],
  );

  // 情境載入失敗 → toast 後端錯誤
  useEffect(() => {
    if (designQuery.error) {
      toast.error(tpl(t('studio.toast.designLoadError'), { msg: designQuery.error.message }));
    }
  }, [designQuery.error, t]);

  // equipmentId → dims 對照
  const catalogQuery = trpc.catalog.list.useQuery();
  const catalogDims = useMemo<EquipmentDims[]>(
    () =>
      (catalogQuery.data ?? []).map((e) => ({
        id: e.id,
        category: e.category,
        widthM: e.widthM ?? null,
        depthM: e.depthM ?? null,
        heightM: e.heightM ?? null,
      })),
    [catalogQuery.data],
  );

  // 切換情境時回到第一個配置
  useEffect(() => {
    setConfigIdx(0);
  }, [designId]);

  const model = useMemo(() => {
    if (!result || !catalogQuery.data) return null;
    return buildLayoutModel(result, configIdx, criterion, catalogDims);
  }, [result, catalogQuery.data, configIdx, criterion, catalogDims]);

  // 若目前 criterion 無設計結果，自動切到可用的目標
  useEffect(() => {
    if (!result) return;
    const dc = result.results[configIdx];
    if (dc && !dc.nonIt.some((n) => n.criterion === criterion) && dc.nonIt.length > 0) {
      setCriterion(dc.nonIt[0].criterion);
    }
  }, [result, configIdx, criterion]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={[t('studio.page.breadcrumbHome'), t('studio.page.title')]}
        title={t('studio.page.title')}
        description={t('studio.page.description')}
      />

      <SourceSelector
        designId={designId}
        onDesignChange={setDesignId}
        configIdx={configIdx}
        onConfigChange={setConfigIdx}
        criterion={criterion}
        onCriterionChange={setCriterion}
        result={result}
        designLoading={designQuery.isFetching}
      />

      {designId != null && !designQuery.isFetching && !result && !designQuery.error && (
        <div className="rounded-xl border border-dashed border-line bg-bg-1 p-10 text-center">
          <TriangleAlert className="mx-auto mb-3 h-6 w-6 text-power" />
          <p className="text-sm text-text-1">{t('studio.source.modelError')}</p>
        </div>
      )}

      {result && !model && (
        <div className="rounded-xl border border-dashed border-line bg-bg-1 p-10 text-center">
          <TriangleAlert className="mx-auto mb-3 h-6 w-6 text-power" />
          <p className="text-sm font-medium text-text-0">{t('studio.source.modelError')}</p>
          <p className="mt-1 text-xs text-text-2">{t('studio.source.modelErrorDesc')}</p>
          <Link
            to="/generator"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {t('studio.source.goGenerator')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {result && model && (
        <>
          <InfoBar model={model} />

          {/* B. 分頁（所有面板保持掛載以保留編輯器狀態） */}
          <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-bg-1 p-1">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  tab === tb.key
                    ? 'border border-accent/30 bg-bg-2 text-accent shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                    : 'border border-transparent text-text-1 hover:text-text-0',
                )}
              >
                {t(tb.labelKey)}
              </button>
            ))}
          </div>

          <div className={cn(tab !== 'floorplan' && 'hidden')}>
            <FloorPlan model={model} />
          </div>
          <div className={cn(tab !== 'scene3d' && 'hidden', 'h-[calc(100vh-230px)] min-h-[640px]')}>
            <DatacenterScene model={model} />
          </div>
          <div className={cn(tab !== 'electrical' && 'hidden')}>
            <ElectricalDiagram model={model} result={result} />
          </div>
          <div className={cn(tab !== 'cooling' && 'hidden')}>
            <CoolingDiagram model={model} result={result} />
          </div>
          <div className={cn(tab !== 'editor' && 'hidden')}>
            <PlacementEditor
              key={`${designId ?? 'none'}:${configIdx}:${criterion}`}
              model={model}
              designId={designId}
            />
          </div>
        </>
      )}
    </div>
  );
}
