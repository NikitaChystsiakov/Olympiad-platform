import { BookOpenCheck, LogOut, ShieldCheck } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(var(--border),0.75)] bg-[rgba(var(--bg),0.82)] backdrop-blur-xl">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--primary))] text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight">Olympus Proctor</p>
            <p className="text-xs text-[rgb(var(--text-soft))]">Онлайн-олимпиады под контролем</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[rgba(var(--surface-muted),0.75)]">
                Олимпиады
              </NavLink>
              <NavLink to="/profile" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[rgba(var(--surface-muted),0.75)]">
                Профиль
              </NavLink>
              <NavLink to="/code-runner" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[rgba(var(--surface-muted),0.75)]">
                Код
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin/users" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[rgba(var(--surface-muted),0.75)]">
                  Пользователи
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="hidden rounded-2xl border border-[rgb(var(--border))] px-4 py-2 md:block">
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--text-soft))]">{user?.role}</p>
              </div>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost">
                  <BookOpenCheck className="h-4 w-4" />
                  Войти
                </Button>
              </Link>
              <Link to="/register">
                <Button>Регистрация</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

