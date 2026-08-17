import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Database, Factory, Server, SlidersHorizontal, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';
import StatCard from '@/components/StatCard';

// 靜態假資料（後續接 tRPC 聚合）
const CATEGORY_DATA = [
  { name: 'CDU 冷卻分配', count: 11, vendor: 'Delta／Vertiv', hasDelta: true },
  { name: 'Chillers 冰水機', count: 9, vendor: 'Carrier／Trane', hasDelta: false },
  { name: 'Dry Coolers 乾冷卻器', count: 7, vendor: 'Evapco／BAC', hasDelta: false },
  { name: 'Evap. Towers 冷卻水塔', count: 6, vendor: 'Evapco／SPX', hasDelta: false },
  { name: 'PDUs 配電單元', count: 8, vendor: 'Delta／Schneider', hasDelta: true },
  { name: 'UPSs 不斷電系統', count: 12, vendor: 'Delta／Vertiv', hasDelta: true },
  { name: 'MSBs 主開關盤', count: 5, vendor: 'Schneider／ABB', hasDelta: false },
  { name: 'Backup Gen. 發電機', count: 7, vendor: 'Cummins／CAT', hasDelta: false },
];

const CHART_COLORS = ['#22D3EE', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#64748B'];

function DeltaDot() {
  return (
    <span
      className="ml-1.5 inline-block h-1.5 w-1.5 animate-led-breathe rounded-full bg-green align-middle"
      title="含台達電子產品"
    />
  );
}

export default function CatalogStats() {
  return (
    <section className="border-y border-line bg-bg-1/50">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
        <SectionHeading
          title="設備型錄現況"
          subtitle="規格取自各廠商官方型錄與資料表，每筆附來源連結"
        />

        {/* 第一列：4 張 StatCard */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="設備總數"
            value={65}
            variant="accent"
            icon={<Database className="h-4 w-4" />}
            hint="8 類非 IT 基礎設備"
            delay={0}
          />
          <StatCard
            label="收錄廠商數"
            value={18}
            variant="green"
            icon={<Factory className="h-4 w-4" />}
            hint={
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" />
                含台達電子 Delta
              </span>
            }
            delay={0.07}
          />
          <StatCard
            label="IT 參考配置數"
            value={24}
            variant="cool"
            icon={<Server className="h-4 w-4" />}
            hint="Canonical＋Reference"
            delay={0.14}
          />
          <StatCard
            label="全域參數數"
            value={22}
            variant="power"
            icon={<SlidersHorizontal className="h-4 w-4" />}
            hint="可調整、可新增自訂"
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
              <h3 className="text-base font-medium text-text-0">八類設備分佈</h3>
              <span className="flex items-center text-xs text-text-2">
                <DeltaDot />
                含台達產品
              </span>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 8, right: 40 }}>
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
                      `${value} 款 · 代表廠商：${(item.payload as (typeof CATEGORY_DATA)[number]).vendor}`,
                      '收錄筆數',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} animationDuration={800}>
                    {CATEGORY_DATA.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-2">
              {CATEGORY_DATA.filter((c) => c.hasDelta).map((c) => (
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
              <h3 className="text-base font-medium text-text-0">焦點供應商：台達電子</h3>
              <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 font-mono text-xs text-green">
                Delta
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-1">
              Modulon DPH／Ultron UPS 11 款、GoCool 液冷 CDU 11 款、rPDU／PDC 配電 5 款已收錄。
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
                <div className="mt-0.5 text-xs text-text-2">效率</div>
              </div>
            </div>
            <Link
              to="/catalog?vendor=Delta"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              在型錄中檢視台達產品
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
