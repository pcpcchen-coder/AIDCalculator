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
  DATACENTER_TYPE_LABELS,
  DC_TYPE_BADGE,
  RACK_TYPE_LABELS,
  fmtNum,
  toCsv,
  downloadFile,
  type ItConfigRow,
} from './catalogMeta';
import type { DatacenterType } from './catalogMeta';
import { NODE_TYPE_LABELS, GENERATION_YEARS } from '@contracts/dcgen';

interface ItConfigTabProps {
  registerHandlers: (h: TabHandlers | null) => void;
}

const NODE_COLORS = ['#22D3EE', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#64748B'];

export default function ItConfigTab({ registerHandlers }: ItConfigTabProps) {
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
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
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
        toast.success(`已匯出 JSON（${rows.length} 筆 IT 配置）`);
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
        toast.success(`已匯出 CSV（${rows.length} 筆 IT 配置）`);
      },
    });
    return () => registerHandlers(null);
  }, [registerHandlers]);

  // ---------------- 刪除 / 複製 ----------------
  const deleteMut = trpc.itConfig.delete.useMutation({
    onSuccess: async () => {
      toast.success('已刪除 IT 配置');
      setDeleteTarget(null);
      await Promise.all([utils.itConfig.list.invalidate(), utils.stats.get.invalidate()]);
    },
    onError: (e) => toast.error(`刪除失敗：${e.message}`),
  });

  const duplicateMut = trpc.itConfig.create.useMutation({
    onSuccess: async () => {
      toast.success('已複製 IT 配置');
      await Promise.all([utils.itConfig.list.invalidate(), utils.stats.get.invalidate()]);
    },
    onError: (e) => toast.error(`複製失敗：${e.message}`),
  });

  const duplicate = (r: ItConfigRow) => {
    duplicateMut.mutate({
      name: `${r.name}（複製）`,
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
            <FilterPill active={dcType === 'all'} label="全部" onClick={() => setDcType('all')} id="it-dctype" />
            {DATACENTER_TYPES.map((t) => (
              <FilterPill
                key={t}
                active={dcType === t}
                label={shortDcLabel(t)}
                title={DATACENTER_TYPE_LABELS[t]}
                onClick={() => setDcType(t)}
                id="it-dctype"
              />
            ))}
          </div>
          {/* 來源膠囊 */}
          <div className="flex gap-2">
            <FilterPill active={modelFilter === 'all'} label="全部來源" onClick={() => setModelFilter('all')} id="it-model" />
            <FilterPill active={modelFilter === 'Canonical'} label="Canonical（論文基準）" onClick={() => setModelFilter('Canonical')} id="it-model" />
            <FilterPill active={modelFilter === 'Reference'} label="Reference（真實系統）" onClick={() => setModelFilter('Reference')} id="it-model" />
          </div>
          {/* 年份膠囊 */}
          <div className="flex gap-2">
            <FilterPill active={generation === 'all'} label="全部年份" onClick={() => setGeneration('all')} id="it-gen" />
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
              placeholder="搜尋配置名稱…"
              className="w-full rounded-lg border border-line bg-bg-1 py-2 pl-9 pr-3 text-sm text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,.15)]"
            />
          </div>
        </div>
      </div>

      {/* ---------------- 錯誤橫幅 ---------------- */}
      {listQuery.isError && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-power/40 bg-power/10 px-4 py-3 text-sm text-power">
          <span>資料載入失敗：{listQuery.error.message}</span>
          <Button size="sm" variant="outline" className="border-power/40 text-power" onClick={() => listQuery.refetch()}>
            重試
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
          <img src="/empty-rack.svg" alt="尚無資料" className="h-28 w-auto opacity-80" />
          <p className="text-sm text-text-1">尚無符合篩選條件的 IT 配置</p>
          <Button size="sm" onClick={() => setDrawer({ open: true, row: null })}>
            ＋ 新增 IT 配置
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
        entityLabel="IT 配置"
        pending={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
      />
    </div>
  );
}

// ---------------- 子元件 ----------------

function shortDcLabel(t: DatacenterType): string {
  switch (t) {
    case 'AI training':
      return 'AI Training';
    case 'AI inference':
      return 'AI Inference';
    case 'Mixed AI training and inference':
      return 'Mixed AI';
    case 'Cloud':
      return 'Cloud';
  }
}

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
  const typeBadge = DC_TYPE_BADGE[row.datacenterType as DatacenterType];
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
          {DATACENTER_TYPE_LABELS[row.datacenterType as DatacenterType] ?? row.datacenterType}
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
        RackSize {row.rackSize}U · RackType {row.rackType}（{RACK_TYPE_LABELS[row.rackType] ?? row.rackType}）· floorSpace {row.floorSpace} m²/rack
      </p>

      {/* Node 明細 + 堆疊功率條 */}
      <div className="mt-4 flex flex-col gap-2">
        {row.nodeTypes.map((n, i) => {
          const kw = n.rackCount * n.rackTdp;
          return (
            <div key={`${n.nodeType}-${i}`}>
              <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                <span className="text-text-1">{NODE_TYPE_LABELS[n.nodeType] ?? n.nodeType}</span>
                <span className="text-text-2">
                  {fmtNum(n.rackCount)} 架 × {fmtNum(n.rackTdp, 1)} kW
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
          <span className="text-text-2">合計</span>
          <span className="text-text-1">{fmtNum(totalRacks)} 架</span>
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
          編輯
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-1 transition-colors hover:bg-bg-3 hover:text-accent"
        >
          <Copy className="h-3.5 w-3.5" />
          複製
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-1 transition-colors hover:bg-bg-3 hover:text-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
          刪除
        </button>
        <Link
          to={`/generator?config=${encodeURIComponent(row.name)}`}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          用此配置產生
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
