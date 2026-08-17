import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  Database,
  SlidersHorizontal,
  FunctionSquare,
  BookOpen,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '總覽', icon: LayoutDashboard, end: true },
  { to: '/generator', label: '配置產生器', icon: Cpu },
  { to: '/catalog', label: '資料庫管理', icon: Database },
  { to: '/parameters', label: '參數管理', icon: SlidersHorizontal },
  { to: '/algorithms', label: '算法管理', icon: FunctionSquare },
  { to: '/docs', label: '模型說明', icon: BookOpen },
] as const;

function LogoBlock() {
  return (
    <Link to="/" className="flex items-center gap-3 px-5 py-5">
      <img src="/logo.svg" alt="DCGen Web Logo" className="h-10 w-10" />
      <div className="leading-tight">
        <div className="font-display text-lg font-bold tracking-tight text-text-0">
          DCGen <span className="text-accent">Web</span>
        </div>
        <div className="text-xs text-text-2">資料中心配置產生平台</div>
      </div>
    </Link>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-1 transition-colors duration-150 hover:bg-bg-2 hover:text-text-0',
              isActive && 'bg-bg-2 text-text-0',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon
                className={cn(
                  'h-[18px] w-[18px] transition-colors',
                  isActive ? 'text-accent' : 'text-text-2 group-hover:text-text-1',
                )}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-line px-5 py-4">
      <span className="inline-flex w-fit items-center rounded-full border border-line bg-bg-2 px-2.5 py-1 font-mono text-xs text-text-1">
        DCGen 1.1 · Web
      </span>
      <div className="flex flex-col gap-1.5 text-xs text-text-2">
        <a
          href="https://arxiv.org/abs/2604.09616"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 transition-colors hover:text-accent"
        >
          論文 arXiv:2604.09616
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://github.com/WedanEmmanuel/DCGen"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 transition-colors hover:text-accent"
        >
          GitHub REPO
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 桌面版：左側固定側欄 240px */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-bg-1 lg:flex">
        <LogoBlock />
        <div className="energy-line mx-3" />
        <div className="mt-4 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <SidebarFooter />
      </aside>

      {/* 行動版：頂列 */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg-1/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="DCGen Web Logo" className="h-8 w-8" />
          <span className="font-display text-base font-bold text-text-0">
            DCGen <span className="text-accent">Web</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="開啟導航選單"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-line bg-bg-2 p-2 text-text-1 transition-colors hover:text-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* 行動版：全高抽屜 */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-bg-1 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between pr-3">
                <LogoBlock />
                <button
                  type="button"
                  aria-label="關閉導航選單"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-line bg-bg-2 p-2 text-text-1 transition-colors hover:text-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="energy-line mx-3" />
              <div className="mt-4 flex-1 overflow-y-auto">
                <NavItems onNavigate={() => setOpen(false)} />
              </div>
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
