import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowUpRight, Copy, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import DeleteDialog from './DeleteDialog';
import ItConfigDrawer from './ItConfigDrawer';
import type { TabHandlers } from './EquipmentTab';
import {
  DATACENTER_TYPES,
  DC_TYPE_BADGE,
  DC_TYPE_I18N_KEYS,
  DC_TYPE_SHORT_I18N_KEYS,
  fmtNum,
  toCsv,
  downloadFile,
  type ItConfigRow,
} from './catalogMeta';
import type { DatacenterType } from './catalogMeta';
import { GENERATION_YEARS } from '@contracts/dcgen';
import { useI18n, tpl } from '@/i18n';

interface ItConfigTabProps {
  registerHandlers: (h: TabHandlers | null) => void;
}

const NODE_COLORS = ['#22D3EE', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#64748B'];

export default function ItConfigTab({ registerHandlers }: ItConfigTabProps) {
  const { t } = useI18n();
  const utils = trpc.useUtils();

  const [dcType, setDcType] = useState<DatacenterType | 'all'>('all');
  const [modelFilter, setModelFilter] = useState<'all' | 'Canonical' | 'Reference'>('all');
  const [generation, setGeneration] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<{ open: boolean; row: ItConfigRow | null }>({
    open: false,
    row: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<ItConfigRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listQuery = trpc.itConfig.list.useQuery({
    datacenterType: dcType === 'all' ? undefined : dcType,
    model: modelFilter === 'all' ? undefined : modelFilter,
    generation: generation === 'all' ? undefined : generation,
  });

  const filteredRows = useMemo(() => {
    const rows = listQuery.data ?? [];
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nodeTypes.some((n) => n.nodeType.toLowerCase().includes(q)),
    );
  }, [listQuery.data, search]);

  // ---------------- 匯出 / 新增 handlers ----------------
  const exportPayloadRef = useRef<ItConfigRow[]>([]);
  exportPayloadRef.current = filteredRows;

  useEffect(() => {
    registerHandlers({
      add: () => setDrawer({ open: true, row: null }),
      exportJson: () => {
        const rows = exportPayloadRef.current;
        downloadFile('dcgen-it-configs.json', JSON.stringify(rows, null, 2), 'application/json');
        toast.success(tpl(t('catalog.export.toastJsonIt'), { count: rows.length }));
      },
      exportCsv: () => {
        const rows = exportPayloadRef.current;
        const csv = toCsv(
          ['id', 'name', 'datacenterType', 'model', 'generation', 'rackSize', 'rackType', 'floorSpace', 'totalRacks', 'totalPowerKw', 'nodeTypes', 'sourceUrl'],
          rows.map((r) => {
            const totalRacks = r.nodeTypes.reduce((s, n) => s + n.rackCount, 0);
            const totalKw = r.nodeTypes.reduce((s, n) => s + n.rackCount * n.rackTdp, 0);
            return [
              r.id, r.name, r.datacenterType, r.model, r.generation, r.rackSize, r.rackType,
              r.floorSpace, totalRacks, totalKw,
              r.nodeTypes.map((n) => `${n.nodeType}:${n.rackCount}x${n.rackTdp}kW`).join('; '),
              r.sourceUrl,
            ];
          }),
        );
        downloadFile('dcgen-it-configs.csv', csv, 'text/csv');
        toast.success(tpl(t('catalog.export.toastCsvIt'), { count: rows.length }));
      },
    });
    return () => registerHandlers(null);
  }, [registerHandlers, t]);

  // ---------------- 刪除 / 複製 ----------------
  const deleteMut = trpc.itConfig.delete.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.deleteIt'));
      setDeleteTarget(null);
      await Promise.all([utils.itConfig.list.invalidate(), utils.stats.get.invalidate()]);
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.deleteFailed'), { msg: e.message })),
  });

  const duplicateMut = trpc.itConfig.create.useMutation({
    onSuccess: async () => {
      toast.success(t('catalog.toast.duplicateIt'));
      await Promise.all([utils.itConfig.list.invalidate(), utils.stats.get.invalidate()]);
    },
    onError: (e) => toast.error(tpl(t('catalog.toast.duplicateFailed'), { msg: e.message })),
  });

  const duplicate = (r: ItConfigRow) => {
    duplicateMut.mutate({
      name: tpl(t('catalog.duplicate.name'), { name: r.name }),
      datacenterType: r.datacenterType as DatacenterType,
      model: r.model === 'Reference' ? 'Reference' : 'Canonical',
      generation: r.generation,
      rackSize: r.rackSize,
      rackType: r.rackType === 'HPC' ? 'HPC' : 'Cloud',
      floorSpace: r.floorSpace,
      sourceUrl: r.sourceUrl,
      notes: r.notes,
      nodeTypes: r.nodeTypes.map((n) => ({
        nodeType: n.nodeType,
        rackCount: n.rackCount,
        rackTdp: n.rackTdp,
      })),
    });
  };

  return (
    <div>
      {/* ---------------- 工具列 ---------------- */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-line bg-bg-1/80 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* DC 類型膠囊 */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <FilterPill active={dcType === 'all'} label={t('common.all')} onClick={() => setDcType('all')} id="it-dctype" />
            {DATACENTER_TYPES.map((dc) => (
              <FilterPill
                key={dc}
                active={dcType === dc}
                label={t(DC_TYPE_SHORT_I18N_KEYS[dc])}
                title={t(DC_TYPE_I18N_KEYS[dc])}
                onClick={() => setDcType(dc)}
                id="it-dctype"
              />
            ))}
          </div>
          {/* 來源膠囊 */}
          <div className="flex gap-2">
            <FilterPill active={modelFilter === 'all'} label={t('catalog.filter.allModels')} onClick={() => setModelFilter('all')} id="it-model" />
            <FilterPill active={modelFilter === 'Canonical'} label={t('catalog.model.canonical')} onClick={() => setModelFilter('Canonical')} id="it-model" />
            <FilterPill active={modelFilter === 'Reference'} label={t('catalog.model.reference')} onClick={() => setModelFilter('Reference')} id="it-model" />
          </div>
          {/* 年份膠囊 */}
          <div className="flex gap-2">
            <FilterPill active={generation === 'all'} label={t('catalog.filter.allYears')} onClick={() => setGeneration('all')} id="it-gen" />
            {GENERATION_YEARS.map((y) => (
              <FilterPill key={y} active={generation === y} label={y} onClick={() => setGeneration(y)} id="it-gen" />
            ))}
          </div>
          {/* 搜尋 */}
          <div className="relative ml-auto min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('catalog.search.configPlaceholder')}
              className="w-full rounded-lg border border-line bg-bg-1 py-2 pl-9 pr-3 text-sm text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,.15)]"
            />
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

      {/* ---------------- 卡片網格 ---------------- */}
      {listQuery.isLoading ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-bg-2" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-line bg-bg-2 px-4 py-16 text-center">
          <img src="/empty-rack.svg" alt={t('catalog.empty.alt')} className="h-28 w-auto opacity-80" />
          <p className="text-sm text-text-1">{t('catalog.empty.it')}</p>
          <Button size="sm" onClick={() => setDrawer({ open: true, row: null })}>
            {t('catalog.empty.addIt')}
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRows.map((r, idx) => (
            <ItConfigCard
              key={r.id}
              row={r}
              index={idx}
              onEdit={() => setDrawer({ open: true, row: r })}
              onDuplicate={() => duplicate(r)}
              onDelete={() => setDeleteTarget(r)}
            />
          ))}
        </div>
      )}

      {/* ---------------- 抽屜與刪除 Dialog ---------------- */}
      <ItConfigDrawer
        open={drawer.open}
        row={drawer.row}
        onClose={() => setDrawer({ open: false, row: null })}
        onSaved={() => setDrawer({ open: false, row: null })}
      />
      <DeleteDialog
        open={deleteTarget !== null}
        name={deleteTarget?.name ?? ''}
        entityLabel={t('catalog.entity.it')}
        pending={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
      />
    </div>
  );
}

// ---------------- 子元件 ----------------

function FilterPill({
  active,
  label,
  title,
  onClick,
  id,
}: {
  active: boolean;
  label: string;
  title?: string;
  onClick: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'relative shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-accent/50 text-accent'
          : 'border-line text-text-1 hover:border-text-2 hover:text-text-0',
      )}
    >
      {active && (
        <motion.span
          layoutId={id}
          className="absolute inset-0 rounded-full bg-accent/10"
          transition={{ duration: 0.2 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

function ItConfigCard({
  row,
  index,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  row: ItConfigRow;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const typeBadge = DC_TYPE_BADGE[row.datacenterType as DatacenterType];
  const dcTypeKey = DC_TYPE_I18N_KEYS[row.datacenterType as DatacenterType];
  const totalRacks = row.nodeTypes.reduce((s, n) => s + n.rackCount, 0);
  const totalKw = row.nodeTypes.reduce((s, n) => s + n.rackCount * n.rackTdp, 0);
  const maxTotal = Math.max(totalKw, 0.001);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.5), ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-shadow hover:border-accent/40 hover:shadow-glow"
    >
      {/* 徽章列 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs', typeBadge ?? 'border-line text-text-1')}>
          {dcTypeKey ? t(dcTypeKey) : row.datacenterType}
        </span>
        <span
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-xs',
            row.model === 'Canonical'
              ? 'border-accent/60 text-accent'
              : 'border-violet/60 text-violet',
          )}
        >
          {row.model}
        </span>
        <span className="inline-flex rounded-full border border-line px-2 py-0.5 font-mono text-xs text-text-1">
          {row.generation}
        </span>
      </div>

      {/* 標題 */}
      <h3 className="mt-3 text-base font-medium leading-snug text-text-0">{row.name}</h3>

      {/* 規格小表 */}
      <p className="mt-1.5 font-mono text-xs text-text-2">
        {tpl(t('catalog.card.spec'), {
          rackSize: row.rackSize,
          rackType: row.rackType,
          rackTypeLabel: t(`catalog.rackType.${row.rackType}`),
          floorSpace: row.floorSpace,
        })}
      </p>

      {/* Node 明細 + 堆疊功率條 */}
      <div className="mt-4 flex flex-col gap-2">
        {row.nodeTypes.map((n, i) => {
          const kw = n.rackCount * n.rackTdp;
          return (
            <div key={`${n.nodeType}-${i}`}>
              <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                <span className="text-text-1">{t(`catalog.nodeType.${n.nodeType}`)}</span>
                <span className="text-text-2">
                  {tpl(t('catalog.card.nodeLine'), { count: fmtNum(n.rackCount), tdp: fmtNum(n.rackTdp, 1) })}
                </span>
                <span className="text-text-0">{fmtNum(kw, 1)} kW</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: NODE_COLORS[i % NODE_COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(kw / maxTotal) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
        <div className="mt-1 flex justify-between border-t border-line pt-2 font-mono text-xs">
          <span className="text-text-2">{t('catalog.card.total')}</span>
          <span className="text-text-1">{tpl(t('catalog.card.totalRacks'), { count: fmtNum(totalRacks) })}</span>
          <span className="font-bold text-accent">{fmtNum(totalKw, 1)} kW</span>
        </div>
      </div>

      {/* 操作列 */}
      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-1 transition-colors hover:bg-bg-3 hover:text-accent"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('common.edit')}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-1 transition-colors hover:bg-bg-3 hover:text-accent"
        >
          <Copy className="h-3.5 w-3.5" />
          {t('catalog.card.duplicate')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-1 transition-colors hover:bg-bg-3 hover:text-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('common.delete')}
        </button>
        <Link
          to={`/generator?config=${encodeURIComponent(row.name)}`}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          {t('catalog.card.generate')}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
