import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, FolderOpen, GitCompareArrows, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DatacenterType, GenerateInput, GenerateResult } from '@contracts/dcgen';
import { DATACENTER_TYPES } from '@contracts/dcgen';
import { trpc } from '@/providers/trpc';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CompareDrawer from '@/components/generator/CompareDrawer';
import type { ComparedDesign } from '@/components/generator/CompareDrawer';
import { TYPE_BADGE_CLASS, fmt, fmtDateTime, typeLabelKey } from '@/components/generator/generator-utils';

interface SavedDesignsProps {
  onLoad: (design: { name: string; input: GenerateInput; result: GenerateResult }) => void;
}

const thCls = 'bg-bg-1 px-3 py-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-text-1';
const tdCls = 'px-3 py-3 text-sm text-text-1';

export default function SavedDesigns({ onLoad }: SavedDesignsProps) {
  const { t, lang } = useI18n();
  const utils = trpc.useUtils();
  const listQuery = trpc.designs.list.useQuery();
  const deleteMutation = trpc.designs.delete.useMutation({
    onSuccess: () => {
      toast.success(t('generator.toast.deleted'));
      void utils.designs.list.invalidate();
    },
    onError: (err) => toast.error(tpl(t('generator.toast.deleteError'), { msg: err.message })),
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | DatacenterType>('All');
  const [selected, setSelected] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compared, setCompared] = useState<ComparedDesign[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const rows = useMemo(() => {
    const data = listQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      if (typeFilter !== 'All' && d.datacenterUseCase !== typeFilter) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [listQuery.data, search, typeFilter]);

  const scaleLabel = (
    scale: { target: 'rack_count'; capacity: number } | { target: 'power_capacity'; capacity: string },
  ): string =>
    scale.target === 'rack_count'
      ? tpl(t('generator.scale.racks'), { n: fmt(scale.capacity) })
      : scale.capacity;

  const toggleSelect = (id: number, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.length >= 3) {
          toast.warning(t('generator.saved.maxCompare'));
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const openDesign = async (id: number) => {
    try {
      const d = await utils.designs.get.fetch({ id });
      onLoad({ name: d.name, input: d.input as GenerateInput, result: d.result as GenerateResult });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(t('generator.toast.loaded'));
    } catch (e) {
      toast.error(
        tpl(t('generator.toast.loadError'), {
          msg: e instanceof Error ? e.message : t('generator.toast.unknownError'),
        }),
      );
    }
  };

  const copyParams = async (id: number) => {
    try {
      const d = await utils.designs.get.fetch({ id });
      const snapshot =
        (d.result as GenerateResult | null)?.parameterSnapshot ?? JSON.parse(d.parameterSnapshot ?? '{}');
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      toast.success(t('generator.snapshot.copied'));
    } catch (e) {
      toast.error(
        tpl(t('generator.toast.copyError'), {
          msg: e instanceof Error ? e.message : t('generator.toast.unknownError'),
        }),
      );
    }
  };

  const startCompare = async () => {
    setLoadingCompare(true);
    try {
      const fetched = await Promise.all(
        selected.map(async (id) => {
          const d = await utils.designs.get.fetch({ id });
          return { id, name: d.name, input: d.input as GenerateInput, result: d.result as GenerateResult };
        }),
      );
      setCompared(fetched);
      setCompareOpen(true);
    } catch (e) {
      toast.error(
        tpl(t('generator.toast.compareError'), {
          msg: e instanceof Error ? e.message : t('generator.toast.unknownError'),
        }),
      );
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <section id="saved" className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-xl font-bold text-text-0 md:text-2xl">
            <span className="inline-block h-5 w-[3px] rounded-full bg-accent" />
            {t('generator.saved.title')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('generator.saved.searchPlaceholder')}
                className="h-9 w-48 rounded-lg border border-line bg-bg-1 pl-8 pr-3 text-sm text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'All' | DatacenterType)}
              className="h-9 rounded-lg border border-line bg-bg-1 px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
            >
              <option value="All">{t('generator.saved.allTypes')}</option>
              {DATACENTER_TYPES.map((ty) => (
                <option key={ty} value={ty}>{t(typeLabelKey(ty))}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={selected.length < 2 || loadingCompare}
              onClick={() => void startCompare()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                selected.length >= 2
                  ? 'border-accent/50 bg-accent/10 text-accent hover:bg-accent/20'
                  : 'cursor-not-allowed border-line bg-bg-1 text-text-2',
              )}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              {tpl(t('generator.saved.compare'), { n: selected.length })}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
          {listQuery.isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <img src="/empty-rack.svg" alt={t('generator.results.emptyAlt')} className="h-28 w-auto opacity-70" />
              <p className="text-sm text-text-1">
                {listQuery.data?.length ? t('generator.saved.emptyFiltered') : t('generator.saved.empty')}
              </p>
              <p className="text-xs text-text-2">{t('generator.saved.emptyHint')}</p>
            </div>
          ) : (
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={cn(thCls, 'w-10')} aria-label={t('generator.saved.colSelect')} />
                  <th className={thCls}>{t('generator.saved.colName')}</th>
                  <th className={thCls}>{t('generator.saved.colType')}</th>
                  <th className={thCls}>{t('generator.saved.colTarget')}</th>
                  <th className={thCls}>{t('generator.saved.colModel')}</th>
                  <th className={thCls}>{t('generator.saved.colCreatedAt')}</th>
                  <th className={cn(thCls, 'text-right')}>{t('generator.saved.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const checked = selected.includes(d.id);
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className={cn(
                        'border-b border-line/60 transition-colors duration-150 hover:bg-bg-3',
                        checked && 'bg-accent/5',
                      )}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleSelect(d.id, v === true)}
                          aria-label={tpl(t('generator.saved.selectRow'), { name: d.name })}
                        />
                      </td>
                      <td className={cn(tdCls, 'max-w-[260px]')}>
                        <span className="block truncate font-medium text-text-0" title={d.name}>{d.name}</span>
                      </td>
                      <td className={tdCls}>
                        <Badge
                          variant="outline"
                          className={cn('text-[11px] font-normal', TYPE_BADGE_CLASS[d.datacenterUseCase])}
                        >
                          {t(typeLabelKey(d.datacenterUseCase))}
                        </Badge>
                      </td>
                      <td className={cn(tdCls, 'font-mono text-xs')}>{scaleLabel(d.scale)}</td>
                      <td className={cn(tdCls, 'font-mono text-xs')}>{d.model}</td>
                      <td className={cn(tdCls, 'font-mono text-xs text-text-2')}>{fmtDateTime(d.createdAt, lang)}</td>
                      <td className={cn(tdCls, 'text-right')}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={t('generator.saved.openTitle')}
                            onClick={() => void openDesign(d.id)}
                            className="rounded-md p-1.5 text-text-2 transition-colors hover:bg-bg-1 hover:text-accent"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={t('generator.saved.copyTitle')}
                            onClick={() => void copyParams(d.id)}
                            className="rounded-md p-1.5 text-text-2 transition-colors hover:bg-bg-1 hover:text-accent"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={t('generator.saved.deleteTitle')}
                            onClick={() => setDeleting({ id: d.id, name: d.name })}
                            className="rounded-md p-1.5 text-text-2 transition-colors hover:bg-bg-1 hover:text-red"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* 刪除確認 */}
      <AlertDialog open={deleting != null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-line bg-bg-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-0">{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-text-1">
              {tpl(t('generator.saved.deleteConfirmDesc'), { name: deleting?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text-0">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red text-bg-0 hover:bg-red/90"
              onClick={() => {
                if (deleting) {
                  deleteMutation.mutate({ id: deleting.id });
                  setSelected((prev) => prev.filter((x) => x !== deleting.id));
                }
                setDeleting(null);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} designs={compared} />
    </section>
  );
}
