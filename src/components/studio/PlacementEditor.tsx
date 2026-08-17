import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FolderOpen, Loader2, Lock, Redo2, Save, Trash2, Unlock } from 'lucide-react';
import type { LayoutDoc, LayoutModel, PlacedOverride, Zone } from '@contracts/layout';
import { INSTANCE_RENDER_CAP } from '@/lib/layoutModel';
import { tpl, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { layoutsApi, useLayoutsUtils, type LayoutListRow } from '@/components/studio/layoutApi';
import TypeBlock, { InstanceBlock } from '@/components/studio/TypeBlock';
import {
  ZOOM_OPTIONS,
  defaultTypeRects,
  instanceKey,
} from '@/components/studio/editorUtils';
import SegmentedControl from '@/components/generator/SegmentedControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const ZONE_KEYS: Record<Zone, string> = {
  white: 'studio.zone.white',
  indoor: 'studio.zone.indoor',
  outdoor: 'studio.zone.outdoor',
};

const ZONES: Zone[] = ['white', 'indoor', 'outdoor'];

interface PlacementEditorProps {
  model: LayoutModel;
  designId: number | null;
}

/** C. 擺放編輯器：公尺座標畫布上的拖放／調尺寸／實例展開／版面存取 */
export default function PlacementEditor({ model, designId }: PlacementEditorProps) {
  const { t, lang } = useI18n();
  const utils = useLayoutsUtils();

  const [overrides, setOverrides] = useState<Record<string, PlacedOverride>>({});
  const [instanceOverrides, setInstanceOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState<number>(24);
  const [expanded, setExpanded] = useState(false);
  const [lockRatio, setLockRatio] = useState(false);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [loaded, setLoaded] = useState<{ id: number; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LayoutListRow | null>(null);

  const baseRects = useMemo(() => defaultTypeRects(model), [model]);
  const rects = useMemo(() => ({ ...baseRects, ...overrides }), [baseRects, overrides]);

  const listQuery = layoutsApi.list.useQuery(undefined, {});
  const saveMutation = layoutsApi.save.useMutation({
    onSuccess: (data) => {
      toast.success(t('studio.toast.saved'));
      setSaveOpen(false);
      setLoaded({ id: data.id, name: saveName.trim() });
      void utils.layouts.list.invalidate();
    },
    onError: (err) => toast.error(tpl(t('studio.toast.saveError'), { msg: err.message })),
  });
  const deleteMutation = layoutsApi.delete.useMutation({
    onSuccess: () => {
      toast.success(t('studio.toast.deleted'));
      setDeleteTarget(null);
      void utils.layouts.list.invalidate();
    },
    onError: (err) => toast.error(tpl(t('studio.toast.deleteError'), { msg: err.message })),
  });

  const commitType = (key: string, rect: PlacedOverride) =>
    setOverrides((prev) => ({ ...prev, [key]: rect }));

  const commitInstance = (key: string, x: number, y: number) =>
    setInstanceOverrides((prev) => ({ ...prev, [key]: { x, y } }));

  const openSave = () => {
    setSaveName(loaded?.name ?? `${model.source.configName} ${model.source.criterion}`);
    setSaveOpen(true);
  };

  const doSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const doc: LayoutDoc = {
      version: 1,
      overrides,
      instanceOverrides,
      zoom,
    };
    saveMutation.mutate({
      id: loaded?.id,
      name,
      designId,
      configName: model.source.configName,
      criterion: model.source.criterion,
      layout: JSON.stringify(doc),
    });
  };

  const loadLayout = async (row: LayoutListRow) => {
    try {
      const full = await utils.layouts.get.fetch({ id: row.id });
      const doc = JSON.parse(full.layout) as LayoutDoc;
      if (doc.version !== 1 || typeof doc.overrides !== 'object' || doc.overrides == null) {
        throw new Error(`unsupported layout version: ${String((doc as { version?: unknown }).version)}`);
      }
      setOverrides(doc.overrides);
      setInstanceOverrides(doc.instanceOverrides ?? {});
      if (typeof doc.zoom === 'number' && (ZOOM_OPTIONS as readonly number[]).includes(doc.zoom)) {
        setZoom(doc.zoom);
      }
      setLoaded({ id: row.id, name: row.name });
      toast.success(tpl(t('studio.toast.loaded'), { name: row.name }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isParse = e instanceof SyntaxError || msg.startsWith('unsupported');
      toast.error(tpl(t(isParse ? 'studio.toast.parseError' : 'studio.toast.loadError'), { msg }));
    }
  };

  const resetAll = () => {
    setOverrides({});
    setInstanceOverrides({});
    setLoaded(null);
    toast.success(t('studio.toast.reset'));
  };

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'zh-CN' ? 'zh-CN' : 'zh-TW', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [lang],
  );

  return (
    <div className="space-y-5">
      {/* ---------------- 工具列 ---------------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-line bg-bg-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-2">
            {t('studio.editor.zoom')}（{t('studio.editor.zoomUnit')}）
          </span>
          <SegmentedControl
            id="studio-zoom"
            size="sm"
            value={String(zoom)}
            onChange={(v) => setZoom(Number(v))}
            options={ZOOM_OPTIONS.map((z) => ({ value: String(z), label: String(z) }))}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-1">
          <Switch checked={expanded} onCheckedChange={setExpanded} />
          {t('studio.editor.expand')}
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-1">
          <Switch checked={lockRatio} onCheckedChange={setLockRatio} />
          {lockRatio ? <Lock className="h-3.5 w-3.5 text-accent" /> : <Unlock className="h-3.5 w-3.5 text-text-2" />}
          {t('studio.editor.lockRatio')}
        </label>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-line bg-bg-0 text-text-1 hover:text-text-0"
            onClick={resetAll}
          >
            <Redo2 className="h-3.5 w-3.5" />
            {t('studio.editor.reset')}
          </Button>
          <Button
            size="sm"
            className="bg-accent/15 text-accent hover:bg-accent/25"
            onClick={openSave}
          >
            <Save className="h-3.5 w-3.5" />
            {t('studio.editor.save')}
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-2">
        {expanded
          ? tpl(t('studio.editor.capHint'), { cap: INSTANCE_RENDER_CAP })
          : t('studio.editor.aggregateHint')}
      </p>

      {/* ---------------- 三個 zone 畫布 ---------------- */}
      {ZONES.map((zone) => {
        const room = model.rooms[zone];
        const zoneTypes = model.types.filter((tp) => tp.zone === zone);
        return (
          <section key={zone} className="rounded-xl border border-line bg-bg-1 p-4">
            <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-sm font-semibold text-text-0">{t(ZONE_KEYS[zone])}</h3>
              <span className="font-mono text-xs text-text-2">
                {tpl(t('studio.zone.size'), { w: room.w.toFixed(1), d: room.d.toFixed(1) })}
              </span>
              <span className="font-mono text-xs text-accent">
                {tpl(t('studio.zone.area'), { n: room.areaM2.toFixed(1) })}
              </span>
            </header>

            <div className="max-h-[70vh] overflow-auto rounded-lg border border-line bg-bg-0">
              <div
                className="relative"
                style={{
                  width: room.w * zoom,
                  height: room.d * zoom,
                  minWidth: '100%',
                  backgroundImage:
                    'linear-gradient(to right, #1E2D4A40 1px, transparent 1px), linear-gradient(to bottom, #1E2D4A40 1px, transparent 1px)',
                  backgroundSize: `${zoom}px ${zoom}px`,
                }}
              >
                {!expanded &&
                  zoneTypes.map((tp) => {
                    const r = rects[tp.key];
                    if (!r) return null;
                    return (
                      <TypeBlock
                        key={tp.key}
                        type={tp}
                        rect={r}
                        zoom={zoom}
                        roomW={room.w}
                        roomD={room.d}
                        lockRatio={lockRatio}
                        onCommit={commitType}
                      />
                    );
                  })}

                {expanded &&
                  zoneTypes.map((tp) => {
                    const inst = model.instances[zone].filter((i) => i.typeKey === tp.key);
                    const shown = inst.slice(0, INSTANCE_RENDER_CAP);
                    const hidden = inst.length - shown.length;
                    const last = shown[shown.length - 1];
                    return (
                      <div key={tp.key} className="contents">
                        {shown.map((i, idx) => {
                          const o = instanceOverrides[instanceKey(tp.key, idx)];
                          return (
                            <InstanceBlock
                              key={`${tp.key}#${idx}`}
                              type={tp}
                              index={idx}
                              x={o?.x ?? i.x}
                              y={o?.y ?? i.y}
                              zoom={zoom}
                              roomW={room.w}
                              roomD={room.d}
                              onCommit={(x, y) => commitInstance(instanceKey(tp.key, idx), x, y)}
                            />
                          );
                        })}
                        {hidden > 0 && last && (
                          <div
                            className="absolute flex items-center justify-center rounded-[3px] border border-dashed font-mono text-[10px] text-text-2"
                            style={{
                              left: Math.min(last.x + tp.w + 0.2, Math.max(0, room.w - tp.w)) * zoom,
                              top: last.y * zoom,
                              width: Math.max(tp.w * zoom, 24),
                              height: Math.max(tp.d * zoom, 16),
                              borderColor: '#64748B',
                              backgroundColor: '#64748B14',
                            }}
                          >
                            {tpl(t('studio.block.more'), { n: hidden })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        );
      })}

      {/* ---------------- 已存版面 ---------------- */}
      <section className="rounded-xl border border-line bg-bg-1 p-5">
        <div className="mb-1 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-0">{t('studio.layouts.title')}</h3>
          {listQuery.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-2" />}
        </div>
        <p className="mb-4 text-xs text-text-2">{t('studio.layouts.desc')}</p>

        {listQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full bg-bg-2" />
            <Skeleton className="h-10 w-full bg-bg-2" />
          </div>
        ) : (listQuery.data ?? []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-bg-0 p-4 text-center text-xs text-text-2">
            {t('studio.layouts.empty')}
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {(listQuery.data ?? []).map((row) => (
              <li
                key={row.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 bg-bg-0 px-4 py-2.5',
                  loaded?.id === row.id && 'border-l-2 border-l-accent',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-0">{row.name}</p>
                  <p className="font-mono text-[11px] text-text-2">
                    {row.configName && row.criterion
                      ? tpl(t('studio.layouts.meta'), { config: row.configName, criterion: row.criterion })
                      : row.configName ?? ''}
                    {' · '}
                    {tpl(t('studio.layouts.updated'), { time: dateFmt.format(new Date(row.updatedAt)) })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-line bg-bg-1 text-text-1 hover:text-accent"
                  onClick={() => void loadLayout(row)}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  {t('studio.layouts.load')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-line bg-bg-1 text-text-1 hover:text-red"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('studio.layouts.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- 儲存 Dialog ---------------- */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="border-line bg-bg-1">
          <DialogHeader>
            <DialogTitle className="text-text-0">{t('studio.save.title')}</DialogTitle>
            <DialogDescription className="text-text-2">{t('studio.save.desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs text-text-1">{t('studio.save.nameLabel')}</Label>
            <Input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t('studio.save.namePlaceholder')}
              className="border-line bg-bg-0 text-text-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-line bg-bg-0 text-text-1"
              onClick={() => setSaveOpen(false)}
            >
              {t('studio.common.cancel')}
            </Button>
            <Button
              className="bg-accent/15 text-accent hover:bg-accent/25"
              disabled={!saveName.trim() || saveMutation.isPending}
              onClick={doSave}
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saveMutation.isPending ? t('studio.save.saving') : t('studio.save.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- 刪除確認 Dialog ---------------- */}
      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-line bg-bg-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-0">{t('studio.layouts.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              {tpl(t('studio.layouts.deleteDesc'), { name: deleteTarget?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-bg-0 text-text-1">
              {t('studio.common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red/15 text-red hover:bg-red/25"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('studio.layouts.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
