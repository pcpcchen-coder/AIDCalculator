import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Copy,
  ChevronDown,
  Server,
  Zap,
  Gauge,
  LayoutGrid,
  Snowflake,
  Boxes,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import type {
  DatacenterResult,
  EquipmentCategory,
  EquipmentDesignEntry,
  GenerateResult,
  OptimizationCriterion,
} from '@contracts/dcgen';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import SegmentedControl from '@/components/generator/SegmentedControl';
import {
  CHART_COLORS,
  EQUIPMENT_CATEGORY_KEYS,
  HEAT_MODE_KEYS,
  deriveMetrics,
  fmt,
  fmtDateTime,
  fmtMw,
  isDeltaVendor,
  pickNonIt,
} from '@/components/generator/generator-utils';

// ---------------- 小工具 ----------------
function useCountUp(target: number, duration = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0B1220',
  border: '1px solid #1E2D4A',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: '"JetBrains Mono", monospace',
  color: '#F1F5F9',
} as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function SectionCard({
  title,
  icon: Icon,
  aside,
  children,
  className,
}: {
  title: string;
  icon?: typeof Zap;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={sectionVariants}
      className={cn('rounded-xl border border-line bg-bg-2 p-5 md:p-6', className)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-medium text-text-0">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

// ---------------- 空狀態 / 載入態 / 錯誤態 ----------------
function EmptyState() {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line bg-bg-2/50 p-10 text-center"
    >
      <img src="/empty-rack.svg" alt={t('generator.results.emptyAlt')} className="h-36 w-auto opacity-80" />
      <p className="text-sm text-text-1">{t('generator.results.emptyHint')}</p>
      <p className="font-mono text-xs text-text-2">{t('generator.results.emptyExample')}</p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 rounded-xl border border-red/50 bg-red/5 p-6"
    >
      <div className="flex items-center gap-2 text-red">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-base font-medium">{t('generator.results.errorTitle')}</h3>
      </div>
      <p className="text-sm leading-relaxed text-text-1">{message}</p>
      <p className="text-xs text-text-2">{t('generator.results.errorHint')}</p>
    </motion.div>
  );
}

// ---------------- 圖表 ----------------
interface PowerSegment {
  name: string;
  value: number;
  color: string;
}

function PowerCompositionBar({ segments }: { segments: PowerSegment[] }) {
  const { t } = useI18n();
  const total = segments.reduce((a, s) => a + s.value, 0);
  const data = [Object.fromEntries(segments.map((s) => [s.name, s.value]))];
  return (
    <div>
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" hide dataKey={() => t('generator.results.power')} />
            <Tooltip
              cursor={{ fill: 'rgba(34,211,238,0.05)' }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [
                tpl(t('generator.results.mwShare'), {
                  mw: fmtMw(value),
                  pct: fmt((value / total) * 100, 1),
                }),
                name,
              ]}
            />
            {segments.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                stackId="power"
                fill={s.color}
                isAnimationActive
                animationDuration={800}
                animationBegin={i * 150}
                radius={i === segments.length - 1 ? [0, 4, 4, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-text-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.name}
            <span className="font-mono text-text-2">
              {fmtMw(s.value)} MW · {total > 0 ? fmt((s.value / total) * 100, 1) : 0}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

function CompositionDonut({
  title,
  data,
  centerValue,
  centerSuffix,
  centerDecimals = 0,
}: {
  title: string;
  data: DonutDatum[];
  centerValue: number;
  centerSuffix: string;
  centerDecimals?: number;
}) {
  const display = useCountUp(centerValue);
  return (
    <div className="flex flex-col items-center">
      <h4 className="mb-1 text-xs font-medium text-text-1">{title}</h4>
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [`${fmt(value, 1)}`, name]}
            />
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              formatter={(value: string) => <span className="text-xs text-text-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
          <span className="font-mono text-2xl font-bold text-text-0">{fmt(display, centerDecimals)}</span>
          <span className="font-mono text-[11px] text-text-2">{centerSuffix}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- BOM 表 ----------------
function VendorCell({ vendor }: { vendor: string | null }) {
  const { t } = useI18n();
  const delta = isDeltaVendor(vendor);
  return (
    <span className="flex items-center gap-1.5 text-text-1">
      {vendor ?? '—'}
      {delta && (
        <span
          title={t('generator.bom.deltaVendor')}
          className="inline-block h-2 w-2 rounded-full bg-green shadow-[0_0_6px_rgba(52,211,153,0.6)]"
        />
      )}
    </span>
  );
}

const thCls = 'bg-bg-1 px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-text-1';
const tdCls = 'px-3 py-2.5 text-sm text-text-1';
const tdMono = cn(tdCls, 'font-mono text-xs');

function CategoryBadge({ category }: { category: string }) {
  const { t } = useI18n();
  const key = EQUIPMENT_CATEGORY_KEYS[category as EquipmentCategory];
  return (
    <Badge variant="outline" className="border-cool/40 bg-cool/10 text-[11px] font-normal text-cool">
      {key ? t(key) : category}
    </Badge>
  );
}

function CoolingBomTable({ designs }: { designs: Partial<Record<EquipmentCategory, EquipmentDesignEntry>> }) {
  const { t } = useI18n();
  const rows = (Object.entries(designs) as [EquipmentCategory, EquipmentDesignEntry][]).filter(
    ([, d]) => d != null,
  );
  if (!rows.length) return <p className="text-sm text-text-2">{t('generator.bom.noCooling')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={thCls}>{t('generator.bom.category')}</th>
            <th className={thCls}>{t('generator.bom.model')}</th>
            <th className={thCls}>{t('generator.bom.vendor')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.count')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.unitsPerPod')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.capacityMw')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.peakPowerMw')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.spaceM2')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, d]) => (
            <tr key={cat} className="border-b border-line/60 transition-colors duration-150 hover:bg-bg-3">
              <td className={tdCls}><CategoryBadge category={cat} /></td>
              <td className={cn(tdMono, 'text-text-0')}>{d.name}</td>
              <td className={tdCls}><VendorCell vendor={d.vendor} /></td>
              <td className={cn(tdMono, 'text-right')}>{fmt(d.totalCount)}</td>
              <td className={cn(tdMono, 'text-right')}>{d.unitsPerPod != null ? fmt(d.unitsPerPod, 1) : '—'}</td>
              <td className={cn(tdMono, 'text-right text-cool')}>{fmtMw(d.totalCapacityMw)}</td>
              <td className={cn(tdMono, 'text-right')}>{d.maxPowerDemandMw != null ? fmtMw(d.maxPowerDemandMw) : '—'}</td>
              <td className={cn(tdMono, 'text-right')}>{d.spaceM2 != null ? fmt(d.spaceM2, 1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PowerBomRows({
  designs,
  stageClass,
}: {
  designs: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
  stageClass: string;
}) {
  const { t } = useI18n();
  const rows = (Object.entries(designs) as [EquipmentCategory, EquipmentDesignEntry][]).filter(
    ([, d]) => d != null,
  );
  if (!rows.length) {
    return (
      <tr className="border-b border-line/60">
        <td colSpan={8} className={cn(tdCls, 'text-text-2')}>{t('generator.bom.noStageEquipment')}</td>
      </tr>
    );
  }
  return (
    <>
      {rows.map(([cat, d]) => (
        <tr key={cat} className="border-b border-line/60 transition-colors duration-150 hover:bg-bg-3">
          <td className={tdCls}>
            <Badge variant="outline" className={cn('text-[11px] font-normal', stageClass)}>
              {t(EQUIPMENT_CATEGORY_KEYS[cat])}
            </Badge>
          </td>
          <td className={cn(tdMono, 'text-text-0')}>{d.name}</td>
          <td className={tdCls}><VendorCell vendor={d.vendor} /></td>
          <td className={cn(tdMono, 'text-right')}>{fmt(d.totalCount)}</td>
          <td className={cn(tdMono, 'text-right text-violet')}>{fmtMw(d.totalCapacityMw)}</td>
          <td className={cn(tdMono, 'text-right')}>
            {d.powerEfficiency != null ? `${fmt(d.powerEfficiency * 100, 1)}%` : '—'}
          </td>
          <td className={cn(tdMono, 'text-right')}>
            {d.maxConversionPowerMw != null ? fmtMw(d.maxConversionPowerMw) : '—'}
          </td>
          <td className={cn(tdMono, 'text-right')}>{d.spaceM2 != null ? fmt(d.spaceM2, 1) : '—'}</td>
        </tr>
      ))}
    </>
  );
}

function PowerBomTable({
  designsIt,
  designsFacility,
}: {
  designsIt: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
  designsFacility: Partial<Record<EquipmentCategory, EquipmentDesignEntry>>;
}) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={thCls}>{t('generator.bom.category')}</th>
            <th className={thCls}>{t('generator.bom.model')}</th>
            <th className={thCls}>{t('generator.bom.vendor')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.count')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.capacityMw')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.efficiency')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.conversionLossMw')}</th>
            <th className={cn(thCls, 'text-right')}>{t('generator.bom.spaceM2')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line bg-bg-1/60">
            <td colSpan={8} className="px-3 py-2 text-xs font-medium tracking-wide text-accent">{t('generator.bom.itStage')}</td>
          </tr>
          <PowerBomRows designs={designsIt} stageClass="border-accent/40 bg-accent/10 text-accent" />
          <tr className="border-b border-line bg-bg-1/60">
            <td colSpan={8} className="px-3 py-2 text-xs font-medium tracking-wide text-violet">{t('generator.bom.facilityStage')}</td>
          </tr>
          <PowerBomRows designs={designsFacility} stageClass="border-violet/40 bg-violet/10 text-violet" />
        </tbody>
      </table>
    </div>
  );
}

// ---------------- 參數快照 ----------------
function ParameterSnapshot({
  result,
  defaults,
}: {
  result: GenerateResult;
  defaults: Record<string, number>;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(result.parameterSnapshot).sort(([a], [b]) => a.localeCompare(b));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.parameterSnapshot, null, 2));
      setCopied(true);
      toast.success(t('generator.snapshot.copied'));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('generator.snapshot.copyFailed'));
    }
  };

  return (
    <div className="rounded-xl border border-line bg-bg-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-5 text-left md:px-6"
      >
        <span className="flex items-center gap-2 text-base font-medium text-text-0">
          <Boxes className="h-4 w-4 text-accent" />
          {t('generator.snapshot.title')}
          <span className="font-mono text-xs font-normal text-text-2">{fmtDateTime(result.createdAt, lang)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              void copy();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                void copy();
              }
            }}
            className="flex items-center gap-1 rounded-lg border border-line bg-bg-1 px-2.5 py-1.5 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
            {t('generator.snapshot.copy')}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-text-2 transition-transform duration-200', open && 'rotate-180')}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-x-8 border-t border-line p-5 sm:grid-cols-2 md:px-6 lg:grid-cols-3">
              {entries.map(([key, value]) => {
                const differs = defaults[key] !== undefined && defaults[key] !== value;
                return (
                  <div key={key} className="flex items-baseline justify-between gap-3 border-b border-line/40 py-1.5">
                    <span className="font-mono text-xs text-text-1">{key}</span>
                    <span className={cn('font-mono text-xs', differs ? 'text-accent' : 'text-text-0')}>
                      {fmt(value, Math.abs(value) < 1 ? 3 : 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- 主儀表板 ----------------
interface ResultsDashboardProps {
  result: GenerateResult | null;
  isLoading: boolean;
  error: string | null;
  /** 表單在產生後被修改 → 顯示 amber 提示 */
  stale: boolean;
  /** parameters.list 的 defaultValue map（快照差異標記用） */
  paramDefaults: Record<string, number>;
}

export default function ResultsDashboard({
  result,
  isLoading,
  error,
  stale,
  paramDefaults,
}: ResultsDashboardProps) {
  const { t } = useI18n();
  const [configIdx, setConfigIdx] = useState(0);
  const [criterion, setCriterion] = useState<OptimizationCriterion | undefined>(undefined);

  // 新結果進來時重設選取
  const resultKey = result?.createdAt;
  useEffect(() => {
    setConfigIdx(0);
    setCriterion(undefined);
  }, [resultKey]);

  const dc: DatacenterResult | undefined = result?.results[Math.min(configIdx, (result?.results.length ?? 1) - 1)];
  const nonIt = dc ? pickNonIt(dc, criterion) : undefined;
  const metrics = useMemo(
    () => (dc ? deriveMetrics(dc, nonIt, result?.input.safetyMargin ?? 0) : null),
    [dc, nonIt, result],
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!result || !dc || !metrics) return <EmptyState />;

  const activeCriterion = nonIt?.criterion;
  const rackEntries = Object.entries(dc.it.rackCount);

  const powerSegments: PowerSegment[] = [
    { name: t('generator.results.segIt'), value: metrics.itMw, color: '#22D3EE' },
    { name: t('generator.results.segCooling'), value: metrics.coolingMw, color: '#38BDF8' },
    { name: t('generator.results.segLoss'), value: metrics.lossMw, color: '#A78BFA' },
    { name: t('generator.results.segSafety'), value: metrics.safetyReserveMw, color: '#64748B' },
  ];

  const spaceData: DonutDatum[] = [
    { name: t('generator.results.whiteSpace'), value: metrics.whiteSpaceM2, color: '#22D3EE' },
    { name: t('generator.results.grayIndoor'), value: metrics.grayIndoorM2, color: '#A78BFA' },
    { name: t('generator.results.grayOutdoor'), value: metrics.grayOutdoorM2, color: '#F59E0B' },
  ];

  const rackData: DonutDatum[] = rackEntries.map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const rackBreakdown = rackEntries.map(([t, n]) => `${t} ${fmt(n)}`).join(' · ');

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.08 }}
      className="relative flex flex-col gap-4"
    >
      {/* 結果切換 + stale 提示 */}
      <motion.div variants={sectionVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {result.results.length > 1 && (
            <SegmentedControl
              id="result-config"
              size="sm"
              value={dc.configName}
              onChange={(v) => setConfigIdx(result.results.findIndex((r) => r.configName === v))}
              options={result.results.map((r) => ({ value: r.configName, label: r.configName }))}
              className="max-w-full"
            />
          )}
          {dc.nonIt.length > 1 && (
            <SegmentedControl
              id="result-criterion"
              size="sm"
              value={activeCriterion ?? 'Space'}
              onChange={(v) => setCriterion(v)}
              options={dc.nonIt.map((n) => ({
                value: n.criterion,
                label:
                  n.criterion === 'Space'
                    ? t('generator.results.criterionSpace')
                    : t('generator.results.criterionPower'),
              }))}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-line font-mono text-[11px] font-normal text-text-2">
            {tpl(t('generator.results.metaBadge'), {
              config: dc.configName,
              generation: dc.it.generation,
              pods: fmt(dc.meta.pods),
              kw: fmt(dc.meta.maxPodPowerKw, 1),
            })}
          </Badge>
          <AnimatePresence>
            {stale && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="animate-pulse rounded-full border border-power/50 bg-power/10 px-2.5 py-1 text-[11px] font-medium text-power"
              >
                {t('generator.results.stale')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* (a) 核心指標卡 */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label={t('generator.results.totalRacks')}
          value={dc.it.totalRacks}
          suffix="racks"
          icon={<Server className="h-4 w-4" />}
          variant="accent"
          hint={rackBreakdown}
        />
        <StatCard
          label={t('generator.results.totalPower')}
          value={metrics.totalMw}
          suffix="MW"
          decimals={1}
          icon={<Zap className="h-4 w-4" />}
          variant="power"
          hint={tpl(t('generator.results.totalPowerHint'), {
            it: fmtMw(metrics.itMw),
            cooling: fmtMw(metrics.coolingMw),
            loss: fmtMw(metrics.lossMw),
          })}
        />
        <StatCard
          label={t('generator.results.powerDensity')}
          value={dc.it.powerDensityKwM2}
          suffix="kW/m²"
          decimals={2}
          icon={<Gauge className="h-4 w-4" />}
          variant="cool"
        />
        <StatCard
          label={t('generator.results.whiteSpace')}
          value={metrics.whiteSpaceM2}
          suffix="m²"
          icon={<LayoutGrid className="h-4 w-4" />}
          variant="green"
          hint={tpl(t('generator.results.whiteSpaceHint'), {
            indoor: fmt(metrics.grayIndoorM2),
            outdoor: fmt(metrics.grayOutdoorM2),
          })}
        />
      </motion.div>

      {/* (b) 功率組成堆疊長條 */}
      <SectionCard
        title={tpl(t('generator.results.powerComposition'), {
          mode: t(
            activeCriterion === 'Power'
              ? 'generator.results.modePower'
              : 'generator.results.modeSpace',
          ),
        })}
        icon={Zap}
      >
        <PowerCompositionBar segments={powerSegments} />
      </SectionCard>

      {/* (c) 雙圓環：空間組成 + IT 機架分佈 */}
      <motion.div variants={sectionVariants} className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t('generator.results.spaceComposition')} icon={LayoutGrid}>
          <CompositionDonut
            title={t('generator.results.spaceDonutTitle')}
            data={spaceData}
            centerValue={metrics.whiteSpaceM2 + metrics.grayIndoorM2 + metrics.grayOutdoorM2}
            centerSuffix={t('generator.results.totalFloorM2')}
          />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line bg-bg-1 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-text-2">
                <span className="h-2 w-2 rounded-sm bg-violet" />
                {t('generator.results.grayIndoor')}
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-text-0">{fmt(metrics.grayIndoorM2)}<span className="ml-1 text-xs font-normal text-text-2">m²</span></div>
            </div>
            <div className="rounded-lg border border-line bg-bg-1 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-text-2">
                <span className="h-2 w-2 rounded-sm bg-power" />
                {t('generator.results.grayOutdoor')}
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-text-0">{fmt(metrics.grayOutdoorM2)}<span className="ml-1 text-xs font-normal text-text-2">m²</span></div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title={t('generator.results.rackDistribution')} icon={Server}>
          <CompositionDonut
            title={t('generator.results.rackDonutTitle')}
            data={rackData}
            centerValue={dc.it.totalRacks}
            centerSuffix={t('generator.results.totalRacksSuffix')}
          />
        </SectionCard>
      </motion.div>

      {/* (d) 冷卻設備 BOM */}
      <SectionCard
        title={t('generator.bom.cooling')}
        icon={Snowflake}
        aside={
          <Badge variant="outline" className="border-cool/40 bg-cool/10 text-[11px] font-normal text-cool">
            {t(HEAT_MODE_KEYS[result.input.heatRejectionMode])}
          </Badge>
        }
      >
        <CoolingBomTable designs={nonIt?.cooling.designs ?? {}} />
      </SectionCard>

      {/* (e) 配電設備 BOM */}
      <SectionCard title={t('generator.bom.power')} icon={Zap}>
        <PowerBomTable
          designsIt={nonIt?.power.designsIt ?? {}}
          designsFacility={nonIt?.power.designsFacility ?? {}}
        />
      </SectionCard>

      {/* (f) 參數快照 */}
      <motion.div variants={sectionVariants}>
        <ParameterSnapshot result={result} defaults={paramDefaults} />
      </motion.div>
    </motion.div>
  );
}
