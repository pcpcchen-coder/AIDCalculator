import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  /** 麵包屑，如 ['資料庫管理', '設備型錄'] */
  breadcrumb?: string[];
  title: string;
  description?: string;
  /** 右側主動作（按鈕等） */
  action?: ReactNode;
}

/** 各內頁共用頁首（design.md §7.2） */
export default function PageHeader({ breadcrumb, title, description, action }: PageHeaderProps) {
  return (
    <motion.header
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-2">
          {breadcrumb.map((item, i) => (
            <span key={item} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-line">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-text-1' : undefined}>
                {item}
              </span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-0 md:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-text-1 md:text-base">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="energy-line mt-6" />
    </motion.header>
  );
}
