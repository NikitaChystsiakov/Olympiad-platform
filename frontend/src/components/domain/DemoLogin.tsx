import { useDemoLogin } from '@/hooks/useDemoLogin';
import { useT } from '@/i18n';
import type { UserRole } from '@/types';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';

const ROLES: Array<{ role: UserRole; key: string }> = [
  { role: 'STUDENT', key: 'demo.asStudent' },
  { role: 'ORGANIZER', key: 'demo.asOrganizer' },
  { role: 'ADMIN', key: 'demo.asAdmin' },
];

/** Segmented one-click demo sign-in. The first option is the primary action. */
export function DemoRoleSwitch({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const t = useT();
  const { signIn, pending } = useDemoLogin();

  return (
    <div
      className={cn(
        'inline-flex flex-wrap justify-center gap-1 rounded-[16px] border p-1.5',
        onDark ? 'border-white/15 bg-white/5' : 'border-line bg-surface shadow-lift',
        className,
      )}
    >
      {ROLES.map(({ role, key }, index) => (
        <button
          key={role}
          type="button"
          disabled={pending !== null}
          onClick={() => void signIn(role)}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-[11px] px-4 text-[15px] font-semibold transition-colors duration-150 disabled:opacity-60',
            index === 0 && onDark
              ? 'bg-white text-ink hover:bg-white/90 dark:bg-accent dark:text-[#0B1512]'
              : index === 0
              ? 'bg-accent text-white hover:bg-accent-strong dark:text-[#0B1512]'
              : onDark
                ? 'text-white hover:bg-white/10'
                : 'text-fg hover:bg-fg/[0.06]',
          )}
        >
          {pending === role && <Spinner />}
          {t(key)}
        </button>
      ))}
    </div>
  );
}
