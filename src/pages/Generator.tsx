import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { GenerateInput, GenerateResult } from '@contracts/dcgen';
import { DATACENTER_TYPE_LABELS } from '@contracts/dcgen';
import { trpc } from '@/providers/trpc';
import PageHeader from '@/components/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GeneratorForm from '@/components/generator/GeneratorForm';
import ResultsDashboard from '@/components/generator/ResultsDashboard';
import SavedDesigns from '@/components/generator/SavedDesigns';
import {
  DEFAULT_FORM,
  QUERY_TYPE_MAP,
  buildGenerateInput,
  exportResultCsv,
  exportResultJson,
  formStateFromInput,
} from '@/components/generator/generator-utils';
import type { FormState } from '@/components/generator/generator-utils';

export default function Generator() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>(() => {
    const q = searchParams.get('type');
    const mapped = q ? QUERY_TYPE_MAP[q.toLowerCase()] : undefined;
    return mapped ? { ...DEFAULT_FORM, datacenterUseCase: mapped } : DEFAULT_FORM;
  });
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  /** 上次送出演算的 input（JSON），用於「參數已變更」偵測 */
  const lastInputRef = useRef<string | null>(null);
  const defaultsAppliedRef = useRef(false);

  // 全域參數 → 表單預設值 + 快照差異比對
  const paramsQuery = trpc.parameters.list.useQuery();
  const paramDefaults = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of paramsQuery.data ?? []) map[p.key] = p.value;
    return {
      safetyMargin: map.safety_margin ?? DEFAULT_FORM.safetyMargin,
      rackPerRow: map.rack_per_row ?? DEFAULT_FORM.rackPerRow,
      rowsPerPod: map.rows_per_pod ?? DEFAULT_FORM.rowsPerPod,
    };
  }, [paramsQuery.data]);
  const paramDefaultValues = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of paramsQuery.data ?? []) map[p.key] = p.defaultValue;
    return map;
  }, [paramsQuery.data]);

  // 參數載入後帶入預設值（僅一次）
  useEffect(() => {
    if (defaultsAppliedRef.current || !paramsQuery.data?.length) return;
    defaultsAppliedRef.current = true;
    const map: Record<string, number> = {};
    for (const p of paramsQuery.data) map[p.key] = p.value;
    setForm((prev) => ({
      ...prev,
      safetyMargin: map.safety_margin ?? prev.safetyMargin,
      rackPerRow: map.rack_per_row ?? prev.rackPerRow,
      rowsPerPod: map.rows_per_pod ?? prev.rowsPerPod,
    }));
  }, [paramsQuery.data]);

  const patchForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const generateMutation = trpc.generate.run.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      toast.success(`演算完成：產生 ${data.results.length} 組配置結果`);
    },
    onError: (err) => {
      setResult(null);
      setError(err.message);
      toast.error(`產生失敗：${err.message}`);
    },
  });

  const utils = trpc.useUtils();
  const saveMutation = trpc.generate.saveDesign.useMutation({
    onSuccess: () => {
      toast.success('情境已儲存');
      setSaveOpen(false);
      void utils.designs.list.invalidate();
    },
    onError: (err) => toast.error(`儲存失敗：${err.message}`),
  });

  const handleGenerate = () => {
    const input = buildGenerateInput(form);
    lastInputRef.current = JSON.stringify(input);
    setError(null);
    generateMutation.mutate(input);
  };

  const stale =
    result != null &&
    lastInputRef.current != null &&
    JSON.stringify(buildGenerateInput(form)) !== lastInputRef.current;

  const openSaveDialog = () => {
    if (!result) return;
    const input = result.input;
    const scale =
      input.datacenterScale.target === 'rack_count'
        ? `${input.datacenterScale.capacity}機架`
        : input.datacenterScale.capacity;
    setSaveName(`${DATACENTER_TYPE_LABELS[input.datacenterUseCase]} ${scale} ${input.generation}`);
    setSaveOpen(true);
  };

  const handleSave = () => {
    if (!result || !saveName.trim()) return;
    saveMutation.mutate({ name: saveName.trim(), result });
  };

  const handleLoadDesign = (design: { name: string; input: GenerateInput; result: GenerateResult }) => {
    setForm(formStateFromInput(design.input));
    setResult(design.result);
    setError(null);
    lastInputRef.current = JSON.stringify(design.input);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['首頁', '配置產生器']}
        title="配置產生器"
        description="設定需求，產生 IT＋冷卻＋配電完整配置。所有運算即時採用目前的全域參數與設備型錄。"
        action={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={!result}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-3.5 py-2 text-sm text-text-1 transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  匯出結果 JSON／CSV
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-line bg-bg-1">
                <DropdownMenuItem
                  className="cursor-pointer text-text-1 focus:bg-bg-3 focus:text-accent"
                  onClick={() => result && exportResultJson(result)}
                >
                  匯出 JSON（完整結果）
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-text-1 focus:bg-bg-3 focus:text-accent"
                  onClick={() => result && exportResultCsv(result)}
                >
                  匯出 CSV（設備 BOM）
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              disabled={!result}
              onClick={openSaveDialog}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-bold text-bg-0 shadow-glow transition-all hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Save className="h-4 w-4" />
              儲存情境
            </button>
          </div>
        }
      />

      {/* 主工作區：左表單 380px / 右結果 flex-1 */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-[380px]">
          <GeneratorForm
            form={form}
            onChange={patchForm}
            onGenerate={handleGenerate}
            isGenerating={generateMutation.isPending}
            paramDefaults={paramDefaults}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ResultsDashboard
            result={result}
            isLoading={generateMutation.isPending}
            error={error}
            stale={stale}
            paramDefaults={paramDefaultValues}
          />
        </div>
      </div>

      <SavedDesigns onLoad={handleLoadDesign} />

      {/* 儲存情境 Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="border-line bg-bg-1">
          <DialogHeader>
            <DialogTitle className="text-text-0">儲存情境</DialogTitle>
            <DialogDescription className="text-text-1">
              將本次演算輸入與結果（含參數快照）存入情境庫，可於下方列表載入、比較。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="save-name" className="text-xs font-medium text-text-1">
              情境名稱
            </label>
            <input
              id="save-name"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="輸入情境名稱…"
              className="h-10 rounded-lg border border-line bg-bg-2 px-3 text-sm text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSaveOpen(false)}
              className="rounded-lg border border-line bg-bg-2 px-4 py-2 text-sm text-text-1 transition-colors hover:bg-bg-3"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!saveName.trim() || saveMutation.isPending}
              onClick={handleSave}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-bg-0 transition-all hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saveMutation.isPending ? '儲存中…' : '儲存'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
