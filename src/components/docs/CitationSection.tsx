import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useI18n } from '@/i18n';
import DocSection from './DocSection';
import { ARXIV_URL, BIBTEX, DELTA_URL, GITHUB_URL } from './docs-data';

const LINKS = [
  { href: ARXIV_URL, labelKey: 'docs.citation.linkArxiv' },
  { href: GITHUB_URL, labelKey: 'docs.citation.linkGithub' },
  { href: DELTA_URL, labelKey: 'docs.citation.linkDelta' },
];

/** Section 10 — 引用：BibTeX 卡＋複製按鈕＋連結列 */
export default function CitationSection() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
    } catch {
      // 降級：選取後由使用者手動複製
      const textarea = document.createElement('textarea');
      textarea.value = BIBTEX;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DocSection id="citation" title={t('docs.citation.title')}>
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="overflow-hidden rounded-xl border border-line bg-bg-1"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-2">
              BibTeX
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={
                copied
                  ? 'inline-flex items-center gap-1.5 rounded-lg border border-green/60 bg-green/10 px-3 py-1.5 text-xs text-green transition-colors'
                  : 'inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-3 py-1.5 text-xs text-text-1 transition-colors hover:border-[rgba(34,211,238,0.4)] hover:text-accent'
              }
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t('docs.citation.copied') : t('docs.citation.copy')}
            </button>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-text-1 md:text-sm">
            {BIBTEX}
          </pre>
        </motion.div>

        <ul className="flex flex-col gap-2.5">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
              >
                {t(link.labelKey)}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </DocSection>
  );
}
