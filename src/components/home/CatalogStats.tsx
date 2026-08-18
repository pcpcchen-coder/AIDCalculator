import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Database, Factory, Server, SlidersHorizontal, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';
import StatCard from '@/components/StatCard';
import { useI18n, tpl } from '@/i18n';

const CHART_COLORS = ['#22D3EE', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#64748B'];

function DeltaDot() {
  const { t } = useI18n();
  return (
    <span
      className="ml-1.5 inline-block h-1.5 w-1.5 animate-led-breathe rounded-full bg-green align-middle"
      title={t('home.stats.deltaDot')}
    />
  );
}

export default function CatalogStats() {
  const { t } = useI18n();
  const statsQuery = trpc.stats.get.useQuery();
  const stats = statsQuery.data;

  // 類別靜態詮釋（順序即圖表順序）；數量即時取自 stats.get
  const CATEGORY_META = [
    { key: 'cdu', name: t('home.stats.cat.cdu'), vendor: 'Delta／Vertiv', hasDelta: true },
    { key: 'chiller', name: t('home.stats.cat.chiller'), vendor: 'Carrier／Trane', hasDelta: false },
    { key: 'dry_cooler', name: t('home.stats.cat.drycooler'), vendor: 'Evapco／BAC', hasDelta: false },
    { key: 'cooling_tower', name: t('home.stats.cat.tower'), vendor: 'Evapco／SPX', hasDelta: false },
    { key: 'pdu', name: t('home.stats.cat.pdu'), vendor: 'Delta／Schneider', hasDelta: true },
    { key: 'ups', name: t('home.stats.cat.ups'), vendor: 'Delta／Vertiv', hasDelta: true },
    { key: 'msb', name: t('home.stats.cat.msb'), vendor: 'Schneider／ABB', hasDelta: false },
    { key: 'generator', name: t('home.stats.cat.gen'), vendor: 'Cummins／CAT', hasDelta: false },
  ];
  const countByCategory = new Map((stats?.categoryBreakdown ?? []).map((c) => [c.category, c.n]));
  const categoryData = CATEGORY_META.map((m) => ({
    ...m,
    count: countByCategory.get(m.key) ?? 0,
  }));

  return (
    <section className="border-y border-line bg-bg-1/50">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
        <SectionHeading
          title={t('home.stats.title')}
          subtitle={t('home.stats.subtitle')}
        />

        {/* 第一列：4 張 StatCard */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('home.stats.total')}
            value={stats?.equipmentCount ?? 65}
            variant="accent"
            icon={<Database className="h-4 w-4" />}
            hint={t('home.stats.totalHint')}
            delay={0}
          />
          <StatCard
            label={t('home.stats.vendors')}
            value={18}
            variant="green"
            icon={<Factory className="h-4 w-4" />}
            hint={
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" />
                {t('home.stats.vendorsHint')}
              </span>
            }
            delay={0.07}
          />
          <StatCard
            label={t('home.stats.itConfigs')}
            value={stats?.itConfigCount ?? 24}
            variant="cool"
            icon={<Server className="h-4 w-4" />}
            hint="Canonical＋Reference"
            delay={0.14}
          />
          <StatCard
            label={t('home.stats.params')}
            value={stats?.parameterCount ?? 22}
            variant="power"
            icon={<SlidersHorizontal className="h-4 w-4" />}
            hint={t('home.stats.paramsHint')}
            delay={0.21}
          />
        </div>

        {/* 第二列：左 7 右 5 */}
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <motion.div
            className="rounded-xl border border-line bg-bg-2 p-5 md:p-6 lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-medium text-text-0">{t('home.stats.chartTitle')}</h3>
              <span className="flex items-center text-xs text-text-2">
                <DeltaDot />
                {t('home.stats.deltaLegend')}
              </span>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(22,35,60,0.5)' }}
                    contentStyle={{
                      background: '#101A2E',
                      border: '1px solid #1E2D4A',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#F1F5F9' }}
                    formatter={(value, _name, item) => [
                      tpl(t('home.stats.tooltip'), {
                        count: Number(value),
                        vendor: (item.payload as (typeof categoryData)[number]).vendor,
                      }),
                      t('home.stats.tooltipName'),
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} animationDuration={800}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-2">
              {categoryData.filter((c) => c.hasDelta).map((c) => (
                <span key={c.name} className="inline-flex items-center">
                  {c.name}
                  <DeltaDot />
                </span>
              ))}
            </div>
          </motion.div>

          {/* 焦點供應商：台達電子 */}
          <motion.div
            className="rounded-xl border border-line bg-bg-2 p-5 md:p-6 lg:col-span-5"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2.5 w-2.5 animate-led-breathe rounded-full bg-green" />
              <h3 className="text-base font-medium text-text-0">{t('home.delta.title')}</h3>
              <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 font-mono text-xs text-green">
                Delta
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-1">
              {t('home.delta.desc')}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-line bg-bg-1 p-3">
                <div className="font-mono text-sm font-bold text-text-0">500–2000</div>
                <div className="mt-0.5 text-xs text-text-2">kVA UPS</div>
              </div>
              <div className="rounded-lg border border-line bg-bg-1 p-3">
                <div className="font-mono text-sm font-bold text-text-0">150–3000</div>
                <div className="mt-0.5 text-xs text-text-2">kW CDU</div>
              </div>
              <div className="rounded-lg border border-line bg-bg-1 p-3">
                <div className="font-mono text-sm font-bold text-text-0">96.5–97.5%</div>
                <div className="mt-0.5 text-xs text-text-2">{t('home.delta.efficiency')}</div>
              </div>
            </div>
            <Link
              to="/catalog?vendor=Delta"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              {t('home.delta.link')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
