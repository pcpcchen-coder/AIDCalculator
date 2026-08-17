import { motion } from 'framer-motion';
import { BookOpenText, Download } from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';

interface ManualEntry {
  key: 'zhTW' | 'zhCN' | 'en';
  /** public/manual/ 下的 docx 路徑（檔案由主代理提供） */
  href: string;
  fileName: string;
  badgeKey: string;
  descKey: string;
}

const MANUALS: ManualEntry[] = [
  {
    key: 'zhTW',
    href: '/manual/DCGen_Web_UserManual_zh-TW.docx',
    fileName: 'DCGen_Web_UserManual_zh-TW.docx',
    badgeKey: 'docs.manual.zhTW.badge',
    descKey: 'docs.manual.zhTW.desc',
  },
  {
    key: 'zhCN',
    href: '/manual/DCGen_Web_UserManual_zh-CN.docx',
    fileName: 'DCGen_Web_UserManual_zh-CN.docx',
    badgeKey: 'docs.manual.zhCN.badge',
    descKey: 'docs.manual.zhCN.desc',
  },
  {
    key: 'en',
    href: '/manual/DCGen_Web_UserManual_en.docx',
    fileName: 'DCGen_Web_UserManual_en.docx',
    badgeKey: 'docs.manual.en.badge',
    descKey: 'docs.manual.en.desc',
  },
];

/** Section — 操作說明書：三語 docx 下載卡（位於資料來源與引用之間） */
export default function ManualSection() {
  const { t } = useI18n();
  return (
    <DocSection id="manual" title={t('docs.manual.title')}>
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-text-1 md:text-base">
          {t('docs.manual.subtitle')}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {MANUALS.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
              className="flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
            >
              <div className="flex items-center justify-between gap-2">
                <BookOpenText className="h-5 w-5 text-cool" />
                <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                  {t(m.badgeKey)}
                </span>
              </div>
              <div className="mt-3 break-all font-mono text-xs text-text-0">{m.fileName}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-1">{t(m.descKey)}</p>
              <a
                href={m.href}
                download={m.fileName}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/20 hover:text-cool"
              >
                <Download className="h-3.5 w-3.5" />
                {t('docs.manual.download')}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </DocSection>
  );
}
