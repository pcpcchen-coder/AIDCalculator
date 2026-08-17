import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface FormDrawerProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** 底部固定操作列 */
  footer?: ReactNode;
}

/** 右側 480px 抽屜：x 100%→0 300ms easeOut，遮罩 fade（catalog.md §3.3） */
export default function FormDrawer({ open, title, subtitle, onClose, children, footer }: FormDrawerProps) {
  const { t } = useI18n();
  // Esc 關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 開啟時鎖定背景捲動
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[480px] flex-col border-l border-line bg-bg-1 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-text-0">{title}</h2>
                {subtitle && <p className="mt-1 text-xs text-text-2">{subtitle}</p>}
              </div>
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={onClose}
                className="rounded-lg border border-line bg-bg-2 p-1.5 text-text-1 transition-colors hover:border-accent/40 hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="border-t border-line bg-bg-1/95 px-6 py-4 backdrop-blur">{footer}</div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
