import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useI18n } from '@/i18n';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-bg-1">
      <motion.div
        className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-3 md:px-8 md:py-14"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <img src="/logo.svg" alt="DCGen Web Logo" className="h-8 w-8" />
            <span className="font-display text-base font-bold text-text-0">
              DCGen <span className="text-accent">Web</span>
            </span>
          </div>
          <p className="text-sm text-text-1">{t('footer.tagline')}</p>
          <p className="mt-3 font-mono text-xs text-text-2">{t('footer.citation')}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
            {t('footer.sources')}
          </h3>
          <p className="text-sm text-text-1">{t('footer.sourcesBody')}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-text-2">
            {t('footer.links')}
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-text-1">
            <li>
              <a
                href="https://arxiv.org/abs/2604.09616"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                {t('footer.paper')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/WedanEmmanuel/DCGen"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                DCGen 開源 REPO
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a
                href="https://www.deltaww.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
              >
                {t('footer.delta')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          </ul>
        </motion.div>
      </motion.div>
      <div className="border-t border-line py-4 text-center font-mono text-xs text-text-2">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}
