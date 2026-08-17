import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Columns3,
  ExternalLink,
  Factory,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DeleteDialog from './DeleteDialog';
import EquipmentDrawer from './EquipmentDrawer';
import {
  CATEGORY_META,
  EQUIPMENT_CATEGORIES,
  isCoolingCategory,
  isDeltaVendor,
  fmtKw,
  fmtDim,
  urlDomain,
  toCsv,
  downloadFile,
  type EquipmentRow,
} from './catalogMeta';
import type { EquipmentCategory } from './catalogMeta';
import { useI18n, tpl } from '@/i18n';

export interface TabHandlers {
  add: () => void;
  exportJson: () => void;
  exportCsv: () => void;
}

interface EquipmentTabProps {
  /** URL query 初始化（?category=dry-cooler / ?vendor=Delta） */
  initialCategory: EquipmentCategory | 'all';
  initialDeltaOnly: boolean;
  registerHandlers: (h: TabHandlers | null) => void;
}

type SortKey = 'capacityKw' | 'power' | 'generation';
type ColKey = 'dims' | 'lambda' | 'generation' | 'source';

const PAGE_SIZE = 15;

const COL_OPTIONS: { key: ColKey; labelKey: string }[] = [
  { key: 'dims', labelKey: 'catalog.cols.dims' },
  { key: 'lambda', labelKey: 'catalog.cols.lambda' },
  { key: 'generation', labelKey: 'catalog.cols.generation' },
  { key: 'source', labelKey: 'catalog.cols.source' },
];

/** 依類別取得「功耗或效率」數值 */
const powerValue = (r: EquipmentRow): number | null =>
  isCoolingCategory(r.category) ? r.peakPowerConsumptionKw : r.efficiency;

export default function EquipmentTab({
  initialCategory,
  initialDeltaOnly,
  registerHandlers,
}: EquipmentTabProps) {
  const { t } = useI18n();
  const utils = trpc.useUtils();

  // ---------------- 篩選狀態 ----------------
  const [category, setCategory] = useState<EquipmentCategory | 'all'>(initialCategory);
  const [deltaOnly, setDeltaOnly] = useState(initialDeltaOnly);
  const [vendorSet, setVendorSet] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(['dims', 'lambda', 'generation', 'source']),
  );
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<{ open: boolean; row: EquipmentRow | null }>({
    open: false,
    row: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRow | null>(null);

  // 搜尋 debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 篩選變更回到第一頁
  useEffect(() => {
    setPage(1);
  }, [category, deltaOnly, search, vendorSet]);

  // ---------------- 查詢 ----------------
  const listQuery = trpc.catalog.list.useQuery({
    category: category === 'all' ? undefined : category,
    search: search || undefined,
    deltaOnly: deltaOnly || undefined,
  });
  // 未篩選全量（分類筆數用）
  const allQuery = trpc.catalog.list.useQuery(undefined, { staleTime: 60_000 });
  const vendorsQuery = trpc.catalog.vendors.useQuery(undefined, { staleTime: 60_000 });

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of allQuery.data ?? []) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return counts;
  }, [allQuery.data]);

  const vendorNames = useMemo(
    () => (vendorsQuery.data ?? []).map((v) => v.name).filter(Boolean) as string[],
    [vendorsQuery.data],
  );

  // 廠商多選（client-side）＋排序
  const filteredRows = useMemo(() => {
    let rows = listQuery.data ?? [];
    if (vendorSet.size > 0) {
      rows = rows.filter((r) => r.vendorName !== null && vendorSet.has(r.vendorName));
    }
    if (sort) {
      const getter: (r: EquipmentRow) => number | null =
        sort.key === 'capacityKw'
          ? (r) => r.capacityKw
          : sort.key === 'power'
            ? powerValue
            : (r) => (r.generation ? Number(r.generation) : null);
      rows = [...rows].sort((a, b) => {
        const va = getter(a);
        const vb = getter(b);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return sort.dir === 'asc' ? va - vb : vb - va;
      });
    }
    return rows;
  }, [listQuery.data, vendorSet, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 篩選簽名（表格列重新進場動畫 key）
  const filterKey = `${category}|${search}|${deltaOnly}|${[...vendorSet].sort().join(',')}|${sort?.key ?? ''}${sort?.dir ?? ''}`;

  // ---------------- 匯出 / 新增 handlers 註冊給頁首 ----------------
  const exportPayloadRef = useRef<EquipmentRow[]>([]);
  exportPayloadRef.current = filteredRows;
  useEffect(() => {
    registerHandlers({
      add: () => setDrawer({ open: true, row: null }),
      exportJson: () => {
        const rows = exportPayloadRef.current;
        downloadFile(
          'dcgen-equipment.json',
          JSON.stringify(rows, null, 2),
          'application/json',
        );
        toast.success(tpl(t('catalog.export.toastJson'), { count: rows.length }));
      },
      exportCsv: () => {
        const rows = exportPayloadRef.current;
        const csv = toCsv(
          ['id', 'name', 'vendorName', 'category', 'capacityKw', 'peakPowerConsumptionKw', 'efficiency', 'heightM', 'widthM', 'depthM', 'accessAreaShare', 'generation', 'sourceUrl', 'notes', 'isCustom', 'engineEligible'],
          rows.map((r) => [
            r.id, r.name, r.vendorName, r.category, r.capacityKw, r.peakPowerConsumptionKw,
            r.efficiency, r.heightM, r.widthM, r.depthM, r.accessAreaShare, r.generation,
            r.sourceUrl, r.notes, r.isCustom, r.engineEligible,
          ]),
        );
        downloadFile('dcgen-equipment.csv', csv, 'text/csv');
        toast.success(tpl(t('catalog.export.toastCsv'), { count: rows.length }));
      },
    });
    return () => registerHandlers(null);
  }, [registerHandlers, t]);

  // ---------------- 刪除 ----------------
  const deleteMut = trpc.catalog.delete.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.deleteEquipment'));
      setDeleteTarget(null);
      await Promise.all([utils.catalog.list.invalidate(), utils.stats.get.invalidate()]);
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.deleteFailed'), { msg: e.message })),
  });

  // ---------------- 欄標 ----------------
  const powerColLabel =
    category === 'all'
      ? t('catalog.table.powerAll')
      : isCoolingCategory(category)
        ? t('catalog.table.powerPeak')
        : t('catalog.table.efficiency');

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === 'asc'
          ? { key, dir: 'desc' }
          : null
        : { key, dir: 'asc' },
    );
  };

  const colSpan = 6 + visibleCols.size;

  return (
    <TooltipProvider delayDuration={200}>
      {/* ---------------- 工具列 ---------------- */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-line bg-bg-1/80 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        {/* 分類膠囊（可橫滑） */}
        <div className="no-scrollbar -mb-1 flex gap-2 overflow-x-auto pb-1">
          <CategoryPill
            active={category === 'all'}
            label={t('common.all')}
            count={allQuery.data?.length}
            onClick={() => setCategory('all')}
          />
          {EQUIPMENT_CATEGORIES.map((c) => (
            <CategoryPill
              key={c}
              active={category === c}
              label={t(`catalog.categoryShort.${c}`)}
              count={categoryCounts.get(c) ?? 0}
              dot={CATEGORY_META[c].dot}
              title={`${CATEGORY_META[c].short} · ${t(`catalog.category.${c}`)}`}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {/* 廠商多選 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-line bg-bg-1 text-text-1 hover:text-text-0">
                <Factory className="h-3.5 w-3.5" />
                {t('catalog.filter.vendor')}
                {vendorSet.size > 0 && (
                  <span className="rounded-full bg-accent/15 px-1.5 font-mono text-xs text-accent">
                    {vendorSet.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>{t('catalog.filter.vendorMulti')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {vendorNames.map((v) => (
                <DropdownMenuCheckboxItem
                  key={v}
                  checked={vendorSet.has(v)}
                  onCheckedChange={(checked) => {
                    setVendorSet((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(v);
                      else next.delete(v);
                      return next;
                    });
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex items-center gap-1.5">
                    {v}
                    {isDeltaVendor(v) && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" title={t('catalog.delta.name')} />
                    )}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              {vendorNames.length === 0 && (
                <p className="px-2 py-3 text-xs text-text-2">{t('catalog.filter.noVendors')}</p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 搜尋 */}
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('catalog.search.placeholder')}
              className="w-full rounded-lg border border-line bg-bg-1 py-2 pl-9 pr-3 text-sm text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,.15)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* 僅看台達 Switch（綠色） */}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-text-1">
              <Switch
                checked={deltaOnly}
                onCheckedChange={setDeltaOnly}
                aria-label={t('catalog.filter.deltaOnlyAria')}
                className="data-[state=checked]:bg-green"
              />
              <span className="inline-block h-1.5 w-1.5 animate-led-breathe rounded-full bg-green" />
              {t('catalog.filter.deltaOnly')}
            </label>

            {/* 欄位顯示設定 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-text-2 hover:text-text-0" aria-label={t('catalog.columns.aria')}>
                  <Columns3 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('catalog.columns.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COL_OPTIONS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={visibleCols.has(c.key)}
                    onCheckedChange={(checked) => {
                      setVisibleCols((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(c.key);
                        else next.delete(c.key);
                        return next;
                      });
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {t(c.labelKey)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ---------------- 錯誤橫幅 ---------------- */}
      {listQuery.isError && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-power/40 bg-power/10 px-4 py-3 text-sm text-power">
          <span>{tpl(t('catalog.error.loadFailed'), { msg: listQuery.error.message })}</span>
          <Button size="sm" variant="outline" className="border-power/40 text-power" onClick={() => listQuery.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* ---------------- 表格 ---------------- */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg-2">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="bg-bg-1 text-left text-xs uppercase tracking-wider text-text-1">
              <th className="px-4 py-3 font-medium">{t('catalog.table.category')}</th>
              <th className="px-4 py-3 font-medium">{t('catalog.table.model')}</th>
              <th className="px-4 py-3 font-medium">{t('catalog.table.vendor')}</th>
              <SortableTh label={t('catalog.table.capacity')} active={sort?.key === 'capacityKw'} dir={sort?.dir} onClick={() => toggleSort('capacityKw')} />
              <SortableTh label={powerColLabel} active={sort?.key === 'power'} dir={sort?.dir} onClick={() => toggleSort('power')} />
              {visibleCols.has('dims') && <th className="px-4 py-3 font-medium">{t('catalog.table.dims')}</th>}
              {visibleCols.has('lambda') && <th className="px-4 py-3 font-medium">λ</th>}
              {visibleCols.has('generation') && (
                <SortableTh label={t('catalog.cols.generation')} active={sort?.key === 'generation'} dir={sort?.dir} onClick={() => toggleSort('generation')} />
              )}
              {visibleCols.has('source') && <th className="px-4 py-3 font-medium">{t('catalog.cols.source')}</th>}
              <th className="px-4 py-3 text-right font-medium">{t('catalog.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`} className="border-t border-line">
                  <td colSpan={colSpan} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-bg-3" />
                  </td>
                </tr>
              ))}

            {!listQuery.isLoading && pageRows.length === 0 && (
              <tr className="border-t border-line">
                <td colSpan={colSpan} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <img src="/empty-rack.svg" alt={t('catalog.empty.alt')} className="h-28 w-auto opacity-80" />
                    <p className="text-sm text-text-1">{t('catalog.empty.equipment')}</p>
                    <Button size="sm" onClick={() => setDrawer({ open: true, row: null })}>
                      {t('catalog.empty.addEquipment')}
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {!listQuery.isLoading &&
              pageRows.map((r, idx) => {
                const delta = isDeltaVendor(r.vendorName);
                const meta = CATEGORY_META[r.category as EquipmentCategory];
                const expanded = expandedId === r.id;
                return [
                  <motion.tr
                    key={`${filterKey}-${r.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3), ease: 'easeOut' }}
                    className={cn(
                      'cursor-pointer border-t border-line transition-colors duration-150 hover:bg-bg-3',
                      expanded && 'bg-bg-3/60',
                      highlightId === r.id && 'animate-pulse-glow',
                    )}
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                  >
                    {/* 分類徽章（台達列左緣 2px 綠標） */}
                    <td className={cn('px-4 py-3', delta && 'border-l-2 border-l-green')}>
                      {meta ? (
                        <span
                          title={meta.short}
                          className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', meta.badge)}
                        >
                          {t(`catalog.categoryShort.${r.category}`)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-2">{r.category}</span>
                      )}
                    </td>
                    {/* 型號 */}
                    <td className="px-4 py-3 font-mono font-bold text-text-0">{r.name}</td>
                    {/* 廠商 */}
                    <td className="px-4 py-3 text-text-1">
                      <span className="flex items-center gap-1.5">
                        {delta && (
                          <span className="inline-block h-1.5 w-1.5 shrink-0 animate-led-breathe rounded-full bg-green" title={t('catalog.delta.name')} />
                        )}
                        {r.vendorName ?? '—'}
                      </span>
                    </td>
                    {/* 容量 */}
                    <td className="px-4 py-3 font-mono text-text-0">{fmtKw(r.capacityKw)}</td>
                    {/* 功耗 / 效率 */}
                    <td className="px-4 py-3 font-mono text-text-0">
                      {isCoolingCategory(r.category)
                        ? fmtKw(r.peakPowerConsumptionKw)
                        : r.efficiency !== null && r.efficiency !== undefined
                          ? `${(r.efficiency * 100).toFixed(1)}%`
                          : '—'}
                    </td>
                    {visibleCols.has('dims') && (
                      <td className="px-4 py-3 font-mono text-xs text-text-1">
                        {r.heightM !== null || r.widthM !== null || r.depthM !== null
                          ? `${fmtDim(r.heightM)}×${fmtDim(r.widthM)}×${fmtDim(r.depthM)}`
                          : '—'}
                      </td>
                    )}
                    {visibleCols.has('lambda') && (
                      <td className="px-4 py-3 font-mono text-xs text-text-1">{r.accessAreaShare}</td>
                    )}
                    {visibleCols.has('generation') && (
                      <td className="px-4 py-3 font-mono text-xs text-text-1">{r.generation ?? '—'}</td>
                    )}
                    {visibleCols.has('source') && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {r.sourceUrl ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={r.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded p-1 text-text-2 transition-colors hover:text-accent"
                                aria-label={tpl(t('catalog.source.aria'), { domain: urlDomain(r.sourceUrl) ?? r.sourceUrl })}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>{urlDomain(r.sourceUrl) ?? r.sourceUrl}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-text-2">—</span>
                        )}
                      </td>
                    )}
                    {/* 操作 */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={tpl(t('catalog.action.edit'), { name: r.name })}
                          className="rounded-lg p-1.5 text-text-2 transition-colors hover:bg-bg-1 hover:text-accent"
                          onClick={() => setDrawer({ open: true, row: r })}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={tpl(t('catalog.action.delete'), { name: r.name })}
                          className="rounded-lg p-1.5 text-text-2 transition-colors hover:bg-bg-1 hover:text-red"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>,
                  expanded ? (
                    <tr key={`${filterKey}-${r.id}-detail`} className="border-t border-line bg-bg-1/60">
                      <td colSpan={colSpan} className="px-4 py-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <ExpandedDetail row={r} />
                        </motion.div>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
          </tbody>
        </table>
      </div>

      {/* ---------------- 分頁 ---------------- */}
      {filteredRows.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-text-2">
          <span className="font-mono text-xs">
            {tpl(t('catalog.pagination.summary'), {
              total: filteredRows.length,
              page: safePage,
              pages: pageCount,
              size: PAGE_SIZE,
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              className="border-line bg-bg-1"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              aria-label={t('catalog.pagination.prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers(safePage, pageCount).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-text-2">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 min-w-8 rounded-lg border px-2 font-mono text-xs transition-colors',
                    p === safePage
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-line bg-bg-1 text-text-1 hover:text-text-0',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <Button
              variant="outline"
              size="icon-sm"
              className="border-line bg-bg-1"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
              aria-label={t('catalog.pagination.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- 抽屜與刪除 Dialog ---------------- */}
      <EquipmentDrawer
        open={drawer.open}
        row={drawer.row}
        initialCategory={category}
        vendors={vendorNames}
        onClose={() => setDrawer({ open: false, row: null })}
        onSaved={(id, mode) => {
          setDrawer({ open: false, row: null });
          if (mode === 'create' && id !== null) {
            setHighlightId(id);
            setTimeout(() => setHighlightId(null), 1600);
          }
        }}
      />
      <DeleteDialog
        open={deleteTarget !== null}
        name={deleteTarget?.name ?? ''}
        entityLabel={t('catalog.entity.equipment')}
        pending={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
      />
    </TooltipProvider>
  );
}

// ---------------- 子元件 ----------------

function CategoryPill({
  active,
  label,
  count,
  dot,
  title,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  dot?: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-accent/50 text-accent'
          : 'border-line text-text-1 hover:border-text-2 hover:text-text-0',
      )}
    >
      {active && (
        <motion.span
          layoutId="equipment-category-pill"
          className="absolute inset-0 rounded-full bg-accent/10"
          transition={{ duration: 0.2 }}
        />
      )}
      {dot && <span className={cn('relative inline-block h-1.5 w-1.5 rounded-full', dot)} />}
      <span className="relative">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'relative rounded-full px-1.5 font-mono text-[10px]',
            active ? 'bg-accent/15 text-accent' : 'bg-bg-3 text-text-2',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir?: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn('flex items-center gap-1 transition-colors hover:text-text-0', active && 'text-accent')}
      >
        {label}
        <motion.span
          animate={{ rotate: active ? (dir === 'desc' ? 180 : 0) : 0, opacity: active ? 1 : 0.35 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowDown className="h-3 w-3" />
        </motion.span>
      </button>
    </th>
  );
}

/** 展開列詳情：三欄（完整規格／尺寸視覺條／來源＋產生配置） */
function ExpandedDetail({ row }: { row: EquipmentRow }) {
  const { t } = useI18n();
  const cooling = isCoolingCategory(row.category);
  const dims = [
    { label: 'H', value: row.heightM, color: 'bg-accent' },
    { label: 'W', value: row.widthM, color: 'bg-cool' },
    { label: 'D', value: row.depthM, color: 'bg-violet' },
  ];
  const maxDim = Math.max(...dims.map((d) => d.value ?? 0), 0.001);
  const specs: [string, string][] = [
    [t('catalog.detail.capacity'), `${fmtKw(row.capacityKw)} kW`],
    cooling
      ? [t('catalog.detail.peakPower'), `${fmtKw(row.peakPowerConsumptionKw)} kW`]
      : [t('catalog.detail.efficiency'), row.efficiency != null ? `${(row.efficiency * 100).toFixed(1)}%` : '—'],
    [t('catalog.detail.lambda'), String(row.accessAreaShare)],
    [t('catalog.detail.generation'), row.generation ?? '—'],
    [
      t('catalog.detail.engine'),
      row.engineEligible ? t('catalog.detail.engineIncluded') : t('catalog.detail.engineExcluded'),
    ],
    [
      t('catalog.detail.source'),
      row.isCustom ? t('catalog.detail.custom') : t('catalog.detail.official'),
    ],
  ];
  return (
    <div className="grid gap-6 py-5 md:grid-cols-3">
      {/* 完整規格 */}
      <div>
        <h4 className="mb-2.5 text-xs font-medium uppercase tracking-wider text-text-2">{t('catalog.detail.fullSpecs')}</h4>
        <dl className="flex flex-col gap-1.5 text-sm">
          {specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-text-2">{k}</dt>
              <dd className="font-mono text-text-0">{v}</dd>
            </div>
          ))}
          {row.notes && (
            <p className="mt-2 rounded-lg border border-line bg-bg-2 p-2.5 text-xs leading-relaxed text-text-1">
              {row.notes}
            </p>
          )}
        </dl>
      </div>
      {/* 尺寸視覺條 */}
      <div>
        <h4 className="mb-2.5 text-xs font-medium uppercase tracking-wider text-text-2">{t('catalog.detail.dimRatio')}</h4>
        <div className="flex flex-col gap-2">
          {dims.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-3 font-mono text-xs text-text-2">{d.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-3">
                {d.value !== null && (
                  <motion.div
                    className={cn('h-full rounded-full', d.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(((d.value ?? 0) / maxDim) * 100, 4)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
              </div>
              <span className="w-16 text-right font-mono text-xs text-text-1">{fmtDim(d.value)}</span>
            </div>
          ))}
          {dims.every((d) => d.value === null) && <p className="text-xs text-text-2">{t('catalog.detail.noDims')}</p>}
        </div>
      </div>
      {/* 來源 + CTA */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-text-2">{t('catalog.detail.sourceTitle')}</h4>
        {row.sourceUrl ? (
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all font-mono text-xs leading-relaxed text-accent hover:underline"
          >
            {row.sourceUrl}
          </a>
        ) : (
          <p className="text-xs text-text-2">{t('catalog.detail.noSource')}</p>
        )}
        <Link
          to={`/generator?equipmentId=${row.id}`}
          className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/20 hover:shadow-glow"
        >
          {t('catalog.detail.generate')}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}
