import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
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
import { cn } from '@/lib/utils';
import ParameterGroup from '@/components/parameters/ParameterGroup';
import AuditPanel from '@/components/parameters/AuditPanel';
import CreateParameterDrawer from '@/components/parameters/CreateParameterDrawer';
import type { CreateParameterInput } from '@/components/parameters/CreateParameterDrawer';
import ParamFlowCard from '@/components/parameters/ParamFlowCard';
import type { ParamItem } from '@/components/parameters/types';
import { categoryMeta, isModified, sortCategories } from '@/components/parameters/types';

export default function Parameters() {
  const utils = trpc.useUtils();
  const listQuery = trpc.parameters.list.useQuery();
  const auditsQuery = trpc.parameters.audits.useQuery({ limit: 50 });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ParamItem | null>(null);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState(0);
  const groupRefs = useRef(new Map<number, HTMLElement>());

  const invalidate = () => {
    void utils.parameters.list.invalidate();
    void utils.parameters.audits.invalidate();
  };

  const updateMut = trpc.parameters.update.useMutation({ onSuccess: invalidate });
  const resetMut = trpc.parameters.reset.useMutation({ onSuccess: invalidate });
  const createMut = trpc.parameters.create.useMutation({ onSuccess: invalidate });
  const deleteMut = trpc.parameters.delete.useMutation({ onSuccess: invalidate });

  const params = useMemo(() => (listQuery.data ?? []) as ParamItem[], [listQuery.data]);

  /** 依分類分組；「自訂參數」群組恆存在（空時顯示 empty 狀態） */
  const groups = useMemo(() => {
    const map = new Map<string, ParamItem[]>();
    for (const p of params) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    const hasCustomGroup = [...map.keys()].some((c) => c === '自訂' || c === '自訂參數');
    if (!hasCustomGroup) map.set('自訂參數', []);
    return sortCategories([...map.keys()]).map((category) => ({
      category,
      items: map.get(category)!,
    }));
  }, [params]);

  const modifiedParams = useMemo(() => params.filter(isModified), [params]);

  // scroll-spy：目前可見群組自動高亮
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-group-index'));
            if (!Number.isNaN(idx)) setActiveGroup(idx);
          }
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    groupRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [groups.length]);

  const scrollToGroup = (index: number) => {
    setActiveGroup(index);
    groupRefs.current.get(index)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdate = async (key: string, value: number) => {
    await updateMut.mutateAsync({ key, value });
    toast.success('參數已更新，下次產生配置即採用');
  };

  const handleReset = async (key: string) => {
    await resetMut.mutateAsync({ key });
    toast.success('已還原為預設值');
  };

  const handleCreate = async (input: CreateParameterInput) => {
    await createMut.mutateAsync(input);
    toast.success('自訂參數已新增');
    setFlashKey(input.key);
    window.setTimeout(() => setFlashKey(null), 1600);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync({ key: deleteTarget.key });
      toast.success(`參數 ${deleteTarget.key} 已刪除`);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '刪除失敗');
    }
  };

  const handleResetAll = async () => {
    setResettingAll(true);
    try {
      for (const p of modifiedParams) {
        await resetMut.mutateAsync({ key: p.key });
      }
      toast.success(`已還原 ${modifiedParams.length} 筆參數為預設值`);
      setResetAllOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '還原失敗');
    } finally {
      setResettingAll(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-12">
        <PageHeader
          breadcrumb={['首頁', '參數管理']}
          title="參數管理"
          description="DCGen 模型的全域參數。調整後立即生效於配置產生器；自訂參數可被自訂算法引用。"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={modifiedParams.length === 0}
                onClick={() => setResetAllOpen(true)}
                className="border-red/40 bg-transparent text-red hover:bg-red/10 hover:text-red disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                還原全部預設
              </Button>
              <Button
                onClick={() => setDrawerOpen(true)}
                className="bg-accent text-bg-0 shadow-glow transition-all hover:scale-[1.02] hover:shadow-glow-strong active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                新增參數
              </Button>
            </div>
          }
        />

        {/* 行動版：分類橫滑膠囊 */}
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto lg:hidden">
          {groups.map((g, i) => (
            <button
              key={g.category}
              type="button"
              onClick={() => scrollToGroup(i)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                activeGroup === i
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line bg-bg-2 text-text-1',
              )}
            >
              {g.category}
              <span className="font-mono text-[10px] text-text-2">{g.items.length}</span>
            </button>
          ))}
        </div>

        <div className="flex items-start gap-6">
          {/* 左欄：分類導覽（桌面） */}
          <aside className="sticky top-6 hidden w-[220px] shrink-0 lg:block">
            <nav className="flex flex-col gap-1">
              {groups.map((g, i) => {
                const Icon = categoryMeta(g.category).icon;
                const active = activeGroup === i;
                return (
                  <button
                    key={g.category}
                    type="button"
                    onClick={() => scrollToGroup(i)}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150',
                      active ? 'bg-bg-2 text-text-0' : 'text-text-1 hover:bg-bg-2/60 hover:text-text-0',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-opacity',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon className={cn('h-4 w-4', active ? 'text-accent' : 'text-text-2')} />
                    <span className="flex-1 truncate text-left">{g.category}</span>
                    <span className="rounded-full border border-line bg-bg-1 px-1.5 py-0.5 font-mono text-[10px] text-text-2">
                      {g.items.length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* 右側主區 */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {listQuery.isLoading ? (
              <div className="flex flex-col gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-xl border border-line bg-bg-2" />
                ))}
              </div>
            ) : listQuery.isError ? (
              <div className="flex items-center gap-3 rounded-xl border border-red/40 bg-red/5 px-5 py-6 text-sm text-red">
                <TriangleAlert className="h-5 w-5 shrink-0" />
                參數載入失敗：{listQuery.error.message}
              </div>
            ) : (
              groups.map((g, i) => (
                <div
                  key={g.category}
                  data-group-index={i}
                  className="scroll-mt-20"
                  ref={(el) => {
                    if (el) groupRefs.current.set(i, el);
                    else groupRefs.current.delete(i);
                  }}
                >
                  <ParameterGroup
                    category={g.category}
                    params={g.items}
                    index={i}
                    flashKey={flashKey}
                    onUpdate={handleUpdate}
                    onReset={handleReset}
                    onRequestDelete={setDeleteTarget}
                    onCreateClick={() => setDrawerOpen(true)}
                  />
                </div>
              ))
            )}

            <AuditPanel
              params={params}
              audits={auditsQuery.data ?? []}
              onReset={handleReset}
            />

            <ParamFlowCard />
          </div>
        </div>
      </div>

      {/* 新增自訂參數抽屜 */}
      <CreateParameterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        existingKeys={params.map((p) => p.key)}
        categories={groups.map((g) => g.category)}
        onCreate={handleCreate}
      />

      {/* 刪除確認 Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-line bg-bg-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-0">確認刪除？</AlertDialogTitle>
            <AlertDialogDescription className="text-text-1">
              即將刪除自訂參數{' '}
              <span className="font-mono text-accent">{deleteTarget?.key}</span>
              ，引用此參數的自訂算法將無法取值。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-red text-bg-0 hover:bg-red/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 還原全部預設確認 Dialog */}
      <AlertDialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
        <AlertDialogContent className="border-line bg-bg-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-0">還原全部預設值？</AlertDialogTitle>
            <AlertDialogDescription className="text-text-1">
              共 <span className="font-mono text-power">{modifiedParams.length}</span>{' '}
              筆已修改參數將還原為預設值，並立即生效於配置產生器。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={resettingAll}
              onClick={(e) => {
                e.preventDefault();
                void handleResetAll();
              }}
              className="bg-red text-bg-0 hover:bg-red/90"
            >
              {resettingAll ? '還原中…' : '全部還原'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
