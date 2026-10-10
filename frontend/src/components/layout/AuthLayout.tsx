import { ArrowRight, GraduationCap, ShieldCheck, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '@/i18n';
import type { UserRole } from '@/types';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import { Spinner } from '@/components/ui/Spinner';
import { PublicHeader } from './PublicHeader';

const DEMO: Array<{ role: UserRole; icon: typeof Trophy; text: string; email: string }> = [
  { role: 'STUDENT', icon: GraduationCap, text: 'auth.demoStudent', email: 'student@test.com' },
  { role: 'ORGANIZER', icon: Trophy, text: 'auth.demoOrganizer', email: 'org@test.com' },
  { role: 'ADMIN', icon: ShieldCheck, text: 'auth.demoAdmin', email: 'admin@test.com' },
];

export function AuthLayout({ title, lead, children, redirectTo }: { title: string; lead: string; children: ReactNode; redirectTo?: string }) {
  const t = useT();
  const { signIn, pending } = useDemoLogin();

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="page-shell grid gap-6 pb-16 pt-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-10 lg:pt-12">
        <section className="rounded-card border border-line bg-surface p-6 shadow-lift sm:p-8">
          <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
          <p className="mt-2 text-soft">{lead}</p>
          <div className="mt-7">{children}</div>
        </section>

        <section aria-labelledby="demo-title" className="self-start">
          <h2 id="demo-title" className="font-serif text-2xl font-semibold">{t('auth.demoTitle')}</h2>
          <p className="mt-1 text-soft">{t('auth.demoLead')}</p>
          <ul className="mt-5 space-y-2.5">
            {DEMO.map(({ role, icon: Icon, text, email }) => (
              <li key={role}>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => void signIn(role, redirectTo)}
                  className="group flex w-full items-center gap-4 rounded-chip border border-line bg-surface p-4 text-left transition-[border-color,box-shadow] duration-150 hover:border-accent/50 hover:shadow-lift disabled:opacity-60"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold">{t(`roles.${role}`)}</span>
                      <span className="font-mono text-xs text-soft">{email}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-soft">{t(text)}</span>
                  </span>
                  {pending === role ? (
                    <Spinner className="text-accent" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-soft transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
