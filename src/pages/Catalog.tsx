import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MiniStats from '@/components/catalog/MiniStats';
import EquipmentTab from '@/components/catalog/EquipmentTab';
import type { TabHandlers } from '@/components/catalog/EquipmentTab';
import ItConfigTab from '@/components/catalog/ItConfigTab';
import { slugToCategory } from '@/components/catalog/catalogMeta';
import type { EquipmentCategory } from '@/components/catalog/catalogMeta';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

type TabKey = 'equipment' | 'it';

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'equipment', labelKey: 'catalog.tabs.equipment' },
  { key: 'it', labelKey: 'catalog.tabs.it' },
];

export default function Catalog() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  // URL query 初始化：?category=dry-cooler（slug 映射）/ ?vendor=Delta（自動開台達篩選）
  const initialCategory: EquipmentCategory | 'all' = useMemo(() => {
    const c = searchParams.get('category');
    return (c && slugToCategory(c)) || 'all';
  }, [searchParams]);
  const initialDeltaOnly = useMemo(() => {
    const v = searchParams.get('vendor');
    return !!v && /delta|台達/i.test(v);
  }, [searchParams]);

  const [tab, setTab] = useState<TabKey>('equipment');

  // 目前分頁註冊的「新增 / 匯出」動作
  const handlersRef = useRef<TabHandlers | null>(null);
  const registerHandlers = useCallback((h: TabHandlers | null) => {
    handlersRef.current = h;
  }, []);

  // ---------------- 統計條資料 ----------------
  const statsQuery = trpc.stats.get.useQuery(undefined, { staleTime: 60_000 });
  const itAllQuery = trpc.itConfig.list.useQuery(undefined, { staleTime: 60_000 });

  const miniStats = useMemo(() => {
    if (tab === 'equipment') {
      const s = statsQuery.data;
      return [
        { value: s?.equipmentCount ?? 0, label: t('catalog.stats.equipment') },
        { value: s?.vendorCount ?? 0, label: t('catalog.stats.vendors') },
        { value: s?.categoryBreakdown.length ?? 8, label: t('catalog.stats.categories') },
        { value: s?.deltaCount ?? 0, label: t('catalog.stats.delta') },
      ];
    }
    const rows = itAllQuery.data ?? [];
    const generations = new Set(rows.map((r) => r.generation));
    const dcTypes = new Set(rows.map((r) => r.datacenterType));
    return [
      { value: statsQuery.data?.itConfigCount ?? rows.length, label: t('catalog.stats.configs') },
      { value: dcTypes.size || 4, label: t('catalog.stats.dcTypes') },
      { value: generations.size || 3, label: t('catalog.stats.generations') },
      { value: rows.filter((r) => r.model === 'Reference').length, label: t('catalog.stats.references') },
    ];
  }, [tab, statsQuery.data, itAllQuery.data, t]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      {/* ---------------- Section 1 頁首 ---------------- */}
      <PageHeader
        breadcrumb={[t('catalog.breadcrumb.home'), t('catalog.title')]}
        title={t('catalog.title')}
        description={t('catalog.description')}
        action={
          <div className="flex items-center gap-2">
            {/* 匯出（依當前分頁篩選結果） */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-line bg-bg-1 text-text-1 hover:text-text-0">
                  <Download className="h-4 w-4" />
                  {t('catalog.export.button')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlersRef.current?.exportJson()}>
                  <FileJson className="h-4 w-4" />
                  {t('catalog.export.json')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlersRef.current?.exportCsv()}>
                  <FileSpreadsheet className="h-4 w-4" />
                  {t('catalog.export.csv')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="shadow-glow transition-all hover:scale-[1.02] hover:shadow-glow-strong active:scale-[0.97]"
              onClick={() => handlersRef.current?.add()}
            >
              <Plus className="h-4 w-4" />
              {t('catalog.add')}
            </Button>
          </div>
        }
      />

      {/* ---------------- Section 2 分頁與統計條 ---------------- */}
      <div role="tablist" aria-label={t('catalog.tabs.ariaLabel')} className="flex gap-6 border-b border-line">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            role="tab"
            aria-selected={tab === tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              'relative pb-3 text-base font-medium transition-colors md:text-lg',
              tab === tabItem.key ? 'text-text-0' : 'text-text-2 hover:text-text-1',
            )}
          >
            {t(tabItem.labelKey)}
            {tab === tabItem.key && (
              <motion.span
                layoutId="catalog-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent shadow-glow"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <MiniStats items={miniStats} />
      </div>

      {/* ---------------- 分頁內容（交叉淡入 250ms） ---------------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {tab === 'equipment' ? (
            <EquipmentTab
              initialCategory={initialCategory}
              initialDeltaOnly={initialDeltaOnly}
              registerHandlers={registerHandlers}
            />
          ) : (
            <ItConfigTab registerHandlers={registerHandlers} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
