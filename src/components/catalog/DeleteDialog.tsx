import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteDialogProps {
  open: boolean;
  /** 實體顯示名稱（Mono 強調） */
  name: string;
  /** 實體類型描述，如「設備」/「IT 配置」 */
  entityLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 刪除確認 Dialog：scale .95→1 fade 200ms（catalog.md 通用行為） */
export default function DeleteDialog({
  open,
  name,
  entityLabel,
  pending,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={`確認刪除${entityLabel}`}
            className="w-full max-w-md rounded-xl border border-line bg-bg-2 p-6 shadow-glow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red/40 bg-red/10">
                <TriangleAlert className="h-4 w-4 text-red" />
              </span>
              <div>
                <h2 className="text-base font-medium text-text-0">確認刪除？</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-1">
                  即將刪除{entityLabel}
                  <span className="mx-1 font-mono font-medium text-text-0">{name}</span>。
                  此操作無法復原；已存情境不受影響（情境含快照）。
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
                取消
              </Button>
              <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
                {pending ? '刪除中…' : '確認刪除'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
