import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';
import { useI18n } from '@/i18n';

export default function Workflow() {
  const { t } = useI18n();

  const steps = [
    {
      no: '01',
      title: t('home.workflow.step1.title'),
      desc: t('home.workflow.step1.desc'),
    },
    {
      no: '02',
      title: t('home.workflow.step2.title'),
      desc: t('home.workflow.step2.desc'),
    },
    {
      no: '03',
      title: t('home.workflow.step3.title'),
      desc: t('home.workflow.step3.desc'),
    },
  ];

  return (
    <section className="border-y border-line bg-bg-1">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
        <SectionHeading title={t('home.workflow.title')} />
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.no}
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.15 }}
            >
              {/* 步驟間虛線連接（桌面版） */}
              {i < steps.length - 1 && (
                <motion.svg
                  className="absolute -right-6 top-8 hidden h-4 w-12 md:block"
                  viewBox="0 0 48 8"
                  fill="none"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.4, duration: 0.4 }}
                >
                  <motion.path
                    d="M0 4 H48"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.4, duration: 0.4, ease: 'easeOut' }}
                  />
                </motion.svg>
              )}
              <div className="bg-gradient-to-r from-accent to-transparent bg-clip-text font-display text-5xl font-bold text-transparent">
                {s.no}
              </div>
              <h3 className="mt-3 text-base font-medium text-text-0">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-1">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            to="/generator"
            className="group inline-flex animate-pulse-glow items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-bg-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
          >
            {t('home.cta.start')}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
