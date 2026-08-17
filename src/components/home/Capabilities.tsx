import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Cpu, Database, SlidersHorizontal, FunctionSquare, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/home/SectionHeading';
import { useI18n } from '@/i18n';

export default function Capabilities() {
  const { t } = useI18n();

  const cards = [
    {
      icon: Cpu,
      title: t('home.capabilities.generator.title'),
      desc: t('home.capabilities.generator.desc'),
      link: { to: '/generator', label: t('home.capabilities.generator.link') },
    },
    {
      icon: Database,
      title: t('home.capabilities.catalog.title'),
      desc: t('home.capabilities.catalog.desc'),
      link: { to: '/catalog', label: t('home.capabilities.catalog.link') },
    },
    {
      icon: SlidersHorizontal,
      title: t('home.capabilities.params.title'),
      desc: t('home.capabilities.params.desc'),
      link: { to: '/parameters', label: t('home.capabilities.params.link') },
    },
    {
      icon: FunctionSquare,
      title: t('home.capabilities.algorithms.title'),
      desc: t('home.capabilities.algorithms.desc'),
      link: { to: '/algorithms', label: t('home.capabilities.algorithms.link') },
    },
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
      <SectionHeading title={t('home.capabilities.title')} aside={t('home.capabilities.aside')} />
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-xl border border-line bg-bg-2 p-6 transition-[border-color] duration-200 hover:border-[rgba(34,211,238,0.4)]"
          >
            {/* hover 頂部 2px cyan 漸層線 */}
            <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-3">
              <card.icon className="h-5 w-5 text-text-1 transition-all duration-200 group-hover:rotate-[8deg] group-hover:text-accent" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-0">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-1">{card.desc}</p>
            <Link
              to={card.link.to}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-cool"
            >
              {card.link.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
