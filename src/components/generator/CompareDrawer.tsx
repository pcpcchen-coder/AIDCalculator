import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GenerateInput, GenerateResult } from '@contracts/dcgen';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import {
  CHART_COLORS,
  TYPE_BADGE_CLASS,
  deriveMetrics,
  fmt,
  fmtMw,
  pickNonIt,
  typeLabelKey,
} from '@/components/generator/generator-utils';

export interface ComparedDesign {
  id: number;
  name: string;
  input: GenerateInput;
  result: GenerateResult;
}

interface CompareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designs: ComparedDesign[];
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0B1220',
  border: '1px solid #1E2D4A',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: '"JetBrains Mono", monospace',
  color: '#F1F5F9',
} as const;

interface MetricRow {
  label: string;
  values: number[];
  format: (v: number) => string;
}

export default function CompareDrawer({ open, onOpenChange, designs }: CompareDrawerProps) {
  const { t } = useI18n();
  const rows: MetricRow[] = useMemo(() => {
    const ms = designs.map((d) => {
      const dc = d.result.results[0];
      const nonIt = dc ? pickNonIt(dc) : undefined;
      return dc ? deriveMetrics(dc, nonIt, d.result.input.safetyMargin) : null;
    });
    const get = (i: number, f: (m: NonNullable<(typeof ms)[number]>) => number) =>
      ms[i] ? f(ms[i]!) : 0;
    const racks = designs.map((d) => d.result.results[0]?.it.totalRacks ?? 0);
    const density = designs.map((d) => d.result.results[0]?.it.powerDensityKwM2 ?? 0);
    return [
      { label: t('generator.results.totalRacks'), values: racks, format: (v) => fmt(v) },
      { label: t('generator.compare.totalPowerMw'), values: designs.map((_, i) => get(i, (m) => m.totalMw)), format: fmtMw },
      { label: `${t('generator.results.itPower')} MW`, values: designs.map((_, i) => get(i, (m) => m.itMw)), format: fmtMw },
      { label: t('generator.compare.powerDensity'), values: density, format: (v) => fmt(v, 2) },
      { label: t('generator.compare.whiteSpace'), values: designs.map((_, i) => get(i, (m) => m.whiteSpaceM2)), format: (v) => fmt(v) },
      { label: t('generator.compare.grayIndoor'), values: designs.map((_, i) => get(i, (m) => m.grayIndoorM2)), format: (v) => fmt(v) },
      { label: t('generator.compare.grayOutdoor'), values: designs.map((_, i) => get(i, (m) => m.grayOutdoorM2)), format: (v) => fmt(v) },
      { label: t('generator.compare.coolingMw'), values: designs.map((_, i) => get(i, (m) => m.coolingMw)), format: fmtMw },
      { label: t('generator.compare.lossMw'), values: designs.map((_, i) => get(i, (m) => m.lossMw)), format: fmtMw },
      { label: t('generator.compare.equipmentCount'), values: designs.map((_, i) => get(i, (m) => m.equipmentCount)), format: (v) => fmt(v) },
    ];
  }, [designs, t]);

  const chartLabels = {
    it: t('generator.compare.chartIt'),
    cooling: t('generator.compare.chartCooling'),
    loss: t('generator.compare.chartLoss'),
    white: t('generator.results.whiteSpace'),
    grayIndoor: t('generator.compare.grayIndoorShort'),
    grayOutdoor: t('generator.compare.grayOutdoorShort'),
  };

  const powerChartData = designs.map((d, i) => ({
    name: d.name.length > 12 ? `${d.name.slice(0, 12)}…` : d.name,
    [chartLabels.it]: rows[2].values[i],
    [chartLabels.cooling]: rows[7].values[i],
    [chartLabels.loss]: rows[8].values[i],
  }));
  const spaceChartData = designs.map((d, i) => ({
    name: d.name.length > 12 ? `${d.name.slice(0, 12)}…` : d.name,
    [chartLabels.white]: rows[4].values[i],
    [chartLabels.grayIndoor]: rows[5].values[i],
    [chartLabels.grayOutdoor]: rows[6].values[i],
  }));

  const exportCsv = () => {
    const header = [t('generator.compare.metric'), ...designs.map((d) => d.name)];
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([row.label, ...row.values.map((v) => row.format(v))].join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcgen-compare-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] border-line bg-bg-1">
        <DrawerHeader className="mx-auto w-full max-w-[1400px] flex-row items-center justify-between border-b border-line px-4 md:px-8">
          <DrawerTitle className="text-lg font-bold text-text-0">
            {tpl(t('generator.compare.title'), { n: designs.length })}
          </DrawerTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-3 py-1.5 text-xs text-text-1 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Download className="h-3.5 w-3.5" />
              {t('generator.compare.exportCsv')}
            </button>
            <button
              type="button"
              aria-label={t('generator.compare.close')}
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:text-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        <div className="mx-auto w-full max-w-[1400px] flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {/* 欄標：各情境名稱 */}
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.06, delayChildren: 0.15 }}
            className="flex flex-col gap-6"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="overflow-x-auto rounded-xl border border-line bg-bg-2"
            >
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className="bg-bg-1 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-text-1">
                      {t('generator.compare.metric')}
                    </th>
                    {designs.map((d) => (
                      <th key={d.id} className="bg-bg-1 px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="max-w-[220px] truncate text-sm font-medium text-text-0" title={d.name}>
                            {d.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-normal', TYPE_BADGE_CLASS[d.input.datacenterUseCase])}
                          >
                            {t(typeLabelKey(d.input.datacenterUseCase))}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const max = Math.max(...row.values);
                    return (
                      <tr key={row.label} className="border-b border-line/60 transition-colors hover:bg-bg-3">
                        <td className="px-4 py-2.5 text-sm text-text-1">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={cn(
                              'px-4 py-2.5 text-right font-mono text-sm',
                              v === max && max > 0 ? 'font-bold text-accent' : 'text-text-0',
                            )}
                          >
                            {row.format(v)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* 並排分組長條圖 */}
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="rounded-xl border border-line bg-bg-2 p-5"
              >
                <h4 className="mb-3 text-sm font-medium text-text-0">{t('generator.compare.powerChartTitle')}</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={powerChartData}>
                      <CartesianGrid stroke="#1E2D4A" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E2D4A' }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(34,211,238,0.05)' }} />
                      <Legend iconSize={8} formatter={(v: string) => <span className="text-xs text-text-1">{v}</span>} />
                      <Bar dataKey={chartLabels.it} stackId="p" fill={CHART_COLORS[0]} animationDuration={600} />
                      <Bar dataKey={chartLabels.cooling} stackId="p" fill={CHART_COLORS[1]} animationDuration={600} />
                      <Bar dataKey={chartLabels.loss} stackId="p" fill={CHART_COLORS[2]} animationDuration={600} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="rounded-xl border border-line bg-bg-2 p-5"
              >
                <h4 className="mb-3 text-sm font-medium text-text-0">{t('generator.compare.spaceChartTitle')}</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spaceChartData}>
                      <CartesianGrid stroke="#1E2D4A" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E2D4A' }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(34,211,238,0.05)' }} />
                      <Legend iconSize={8} formatter={(v: string) => <span className="text-xs text-text-1">{v}</span>} />
                      <Bar dataKey={chartLabels.white} fill={CHART_COLORS[0]} animationDuration={600} />
                      <Bar dataKey={chartLabels.grayIndoor} fill={CHART_COLORS[2]} animationDuration={600} />
                      <Bar dataKey={chartLabels.grayOutdoor} fill={CHART_COLORS[3]} animationDuration={600} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
