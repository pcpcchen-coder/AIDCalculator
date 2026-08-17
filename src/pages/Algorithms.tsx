import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import AlgorithmList from '@/components/algorithms/AlgorithmList';
import AlgorithmDetail from '@/components/algorithms/AlgorithmDetail';
import type { AlgoUpdateData } from '@/components/algorithms/AlgorithmDetail';
import AlgorithmDrawer from '@/components/algorithms/AlgorithmDrawer';
import AlgorithmIndex from '@/components/algorithms/AlgorithmIndex';
import type { AlgoItem, ParamOption } from '@/components/algorithms/types';
import { ALGO_KEY_PATTERN } from '@/components/algorithms/types';
import type { ParamItem } from '@/components/parameters/types';

export default function Algorithms() {
  const utils = trpc.useUtils();
  const algosQuery = trpc.algorithms.list.useQuery();
  const paramsQuery = trpc.parameters.list.useQuery();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAlgo, setEditingAlgo] = useState<AlgoItem | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<AlgoItem | null>(null);
  const [duplicateKey, setDuplicateKey] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AlgoItem | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const algorithms = useMemo(() => (algosQuery.data ?? []) as AlgoItem[], [algosQuery.data]);

  const paramOptions = useMemo<ParamOption[]>(
    () =>
      ((paramsQuery.data ?? []) as ParamItem[]).map((p) => ({
        key: p.key,
        value: p.value,
        unit: p.unit,
        category: p.category,
        description: p.description,
      })),
    [paramsQuery.data],
  );
  const paramMap = useMemo(() => new Map(paramOptions.map((p) => [p.key, p])), [paramOptions]);

  // 預設選取第一條內建算法
  useEffect(() => {
    if (!selectedKey && algorithms.length > 0) {
      setSelectedKey(algorithms.find((a) => a.isBuiltin)?.key ?? algorithms[0]!.key);
    }
  }, [algorithms, selectedKey]);

  const selectedAlgo = useMemo(() => {
    if (!algorithms.length) return null;
    return algorithms.find((a) => a.key === selectedKey) ?? algorithms[0]!;
  }, [algorithms, selectedKey]);

  const updateMut = trpc.algorithms.update.useMutation({
    onSuccess: () => void utils.algorithms.list.invalidate(),
  });
  const duplicateMut = trpc.algorithms.duplicate.useMutation({
    onSuccess: () => void utils.algorithms.list.invalidate(),
  });
  const deleteMut = trpc.algorithms.delete.useMutation({
    onSuccess: () => void utils.algorithms.list.invalidate(),
  });

  const handleUpdate = async (key: string, data: AlgoUpdateData) => {
    await updateMut.mutateAsync({ key, data });
  };

  const scrollToDetail = () => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    scrollToDetail();
  };

  const handleDrawerSaved = (key: string, mode: 'create' | 'edit') => {
    setSelectedKey(key);
    if (mode === 'create') scrollToDetail();
  };

  const exportJson = () => {
    const payload = algorithms.map((a) => ({
      key: a.key,
      name: a.name,
      category: a.category,
      paperRef: a.paperRef,
      version: a.version,
      enabled: a.enabled,
      isBuiltin: a.isBuiltin,
      description: a.description,
      formula: a.formula,
      formulaDisplay: a.formulaDisplay,
      parameterBindings: a.parameterBindings ? JSON.parse(a.parameterBindings) : {},
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dcgen-algorithms.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已匯出算法定義 JSON');
  };

  const dupKeyError = useMemo(() => {
    if (!duplicateKey) return null;
    if (!ALGO_KEY_PATTERN.test(duplicateKey)) return 'key 僅能包含英數與底線，且不得以數字開頭';
    if (algorithms.some((a) => a.key === duplicateKey)) return '此 key 已存在';
    return null;
  }, [duplicateKey, algorithms]);

  const handleDuplicate = async () => {
    if (!duplicateTarget || !duplicateKey || dupKeyError) return;
    try {
      await duplicateMut.mutateAsync({ key: duplicateTarget.key, newKey: duplicateKey });
      toast.success(`已複製為自訂算法 ${duplicateKey}，可編輯公式`);
      setSelectedKey(duplicateKey);
      setDuplicateTarget(null);
      scrollToDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '複製失敗');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync({ key: deleteTarget.key });
      toast.success(`算法 ${deleteTarget.key} 已刪除`);
      if (selectedKey === deleteTarget.key) setSelectedKey(null);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '刪除失敗');
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-12">
      <PageHeader
        breadcrumb={['首頁', '算法管理']}
        title="算法管理"
        description="DCGen 論文式 1–19 的註冊表實作。每條算法具名、具版本、公式透明；可調整參數綁定，或以安全公式求值器新增自訂算法。"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportJson}
              disabled={algorithms.length === 0}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              <Download className="h-4 w-4" />
              匯出算法定義 JSON
            </Button>
            <Button
              onClick={() => {
                setEditingAlgo(null);
                setDrawerOpen(true);
              }}
              className="bg-accent text-bg-0 shadow-glow transition-all hover:scale-[1.02] hover:shadow-glow-strong active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              新增算法
            </Button>
          </div>
        }
      />

      {algosQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="h-[60vh] animate-pulse rounded-xl border border-line bg-bg-2" />
          <div className="h-[60vh] animate-pulse rounded-xl border border-line bg-bg-2" />
        </div>
      ) : algosQuery.isError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red/40 bg-red/5 px-5 py-6 text-sm text-red">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          算法載入失敗：{algosQuery.error.message}
        </div>
      ) : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* 左欄：算法清單 */}
            <div className="rounded-xl border border-line bg-bg-2 p-3 lg:sticky lg:top-6">
              <AlgorithmList
                algorithms={algorithms}
                selectedKey={selectedAlgo?.key ?? null}
                onSelect={setSelectedKey}
              />
            </div>

            {/* 右欄：詳情 */}
            <div ref={detailRef} className="min-w-0 scroll-mt-20">
              {selectedAlgo && (
                <AlgorithmDetail
                  key={selectedAlgo.key}
                  algo={selectedAlgo}
                  paramOptions={paramOptions}
                  paramMap={paramMap}
                  onUpdate={handleUpdate}
                  onRequestDuplicate={(a) => {
                    setDuplicateTarget(a);
                    setDuplicateKey(`${a.key}_custom`);
                  }}
                  onRequestDelete={setDeleteTarget}
                  onRequestEdit={(a) => {
                    setEditingAlgo(a);
                    setDrawerOpen(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Section 4：速覽表 */}
          <AlgorithmIndex algorithms={algorithms} onSelect={handleSelect} />
        </>
      )}

      {/* 新增／編輯算法抽屜 */}
      <AlgorithmDrawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setEditingAlgo(null);
        }}
        algo={editingAlgo}
        existingKeys={algorithms.map((a) => a.key)}
        categories={[...new Set(algorithms.map((a) => a.category))]}
        paramOptions={paramOptions}
        paramMap={paramMap}
        onSaved={handleDrawerSaved}
      />

      {/* 複製為自訂算法 Dialog */}
      <Dialog
        open={duplicateTarget !== null}
        onOpenChange={(o) => !o && setDuplicateTarget(null)}
      >
        <DialogContent className="border-line bg-bg-1">
          <DialogHeader>
            <DialogTitle className="text-text-0">複製為自訂算法</DialogTitle>
            <DialogDescription className="text-text-1">
              複製 <span className="font-mono text-accent">{duplicateTarget?.key}</span>
              （{duplicateTarget?.name}）為自訂算法，複製後可修改公式與綁定。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dup-key" className="text-text-1">
              新算法 Key
            </Label>
            <Input
              id="dup-key"
              value={duplicateKey}
              onChange={(e) => setDuplicateKey(e.target.value)}
              className={cn(
                'border-line bg-bg-0 font-mono text-text-0',
                dupKeyError && 'border-red',
              )}
            />
            {dupKeyError && <p className="text-xs text-red">{dupKeyError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateTarget(null)}
              className="border-line bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0"
            >
              取消
            </Button>
            <Button
              disabled={!duplicateKey || !!dupKeyError || duplicateMut.isPending}
              onClick={() => void handleDuplicate()}
              className="bg-accent text-bg-0 hover:bg-accent/90"
            >
              {duplicateMut.isPending ? '複製中…' : '複製'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-line bg-bg-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-0">確認刪除？</AlertDialogTitle>
            <AlertDialogDescription className="text-text-1">
              即將刪除自訂算法{' '}
              <span className="font-mono text-accent">{deleteTarget?.key}</span>
              （{deleteTarget?.name}）。此操作無法復原。
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
    </div>
  );
}
