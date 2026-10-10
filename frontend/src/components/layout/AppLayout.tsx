import { Code2, LogOut, Menu, Trophy, UserRound, Users, X } from 'lucide-react';
import { Suspense, useEffect, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import { cn } from '@/utils/cn';
import { LocaleSwitch, ThemeToggle } from '@/components/domain/Preferences';
import { Logo } from '@/components/ui/Logo';
import { PageSkeleton } from '@/components/ui/Skeleton';

interface NavItem {
  to: string;
  key: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', key: 'nav.olympiads', icon: Trophy },
  { to: '/code-runner', key: 'nav.sandbox', icon: Code2 },
  { to: '/admin/users', key: 'nav.users', icon: Users, roles: ['ADMIN'] },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
];

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const { user, logout } = useAuthStore();
  const items = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <Logo to="/dashboard" className="px-2" />

      <nav aria-label={t('nav.menu')} className="flex flex-col gap-0.5">
        {items.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center gap-3 rounded-control px-3 text-[15px] font-medium transition-colors duration-150',
                isActive ? 'bg-surface text-fg shadow-lift' : 'text-soft hover:bg-fg/[0.05] hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-[18px] w-[18px]', isActive && 'text-accent')} />
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="flex items-center gap-2 px-1">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 rounded-chip border border-line bg-surface p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
            {initials(user?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.fullName}</p>
            <p className="truncate text-xs text-soft">{user ? t(`roles.${user.role}`) : ''}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-soft transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>

      <aside className="sticky top-0 hidden h-screen border-r border-line lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <Logo to="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('nav.menu')}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-control text-fg hover:bg-fg/[0.06]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label={t('common.close')} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(300px,85vw)] animate-rise bg-canvas shadow-float">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-control text-soft hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        <div className="mx-auto w-full max-w-[1200px] animate-rise" key={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
