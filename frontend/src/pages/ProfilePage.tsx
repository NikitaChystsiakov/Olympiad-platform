import { useEffect, useState } from 'react';
import { getMyAttempts } from '@/api/participations';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { Attempt } from '@/types';
import { formatShort } from '@/utils/format';
import { LocaleSwitch, ThemeToggle } from '@/components/domain/Preferences';
import { AttemptStatusBadge } from '@/components/domain/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProfilePage() {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') return;
    getMyAttempts()
      .then(setAttempts)
      .catch(() => setAttempts([]));
  }, [user?.role]);

  if (!user) return null;

  return (
    <>
      <PageHeader title={user.fullName} lead={user.email} meta={<Badge tone="accent">{t(`roles.${user.role}`)}</Badge>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
          <h2 className="font-serif text-xl font-semibold">{t('profile.account')}</h2>
          <dl className="mt-4 divide-y divide-line">
            {[
              [t('common.fullName'), user.fullName],
              [t('common.email'), user.email],
              [t('common.role'), t(`roles.${user.role}`)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-soft">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
          <h2 className="font-serif text-xl font-semibold">{t('profile.preferences')}</h2>
          <dl className="mt-4 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-soft">{t('profile.language')}</dt>
              <dd>
                <LocaleSwitch />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-soft">{t('profile.theme')}</dt>
              <dd>
                <ThemeToggle />
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {user.role === 'STUDENT' && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-xl font-semibold">{t('profile.attempts')}</h2>
          {attempts === null ? (
            <Skeleton className="h-32 w-full rounded-card" />
          ) : attempts.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-4 text-soft">{t('dashboard.noAttempts')}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-lift">
              {attempts.map((attempt) => {
                const active = attempt.status === 'ACTIVE';
                return (
                  <li key={attempt.id} className="grid items-center gap-x-5 gap-y-2 px-5 py-4 sm:grid-cols-[1fr_200px_auto]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{attempt.olympiadTitle}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-sm text-soft">
                        <AttemptStatusBadge status={attempt.status} />
                        {formatShort(attempt.finishedAt ?? attempt.startedAt)}
                      </p>
                    </div>
                    {active ? (
                      <span />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="num w-[60px] font-serif text-lg font-semibold">
                          {attempt.score ?? 0}
                          <span className="text-sm font-normal text-soft">/{attempt.maxPossibleScore}</span>
                        </span>
                        <ScoreBar value={attempt.score ?? 0} max={attempt.maxPossibleScore} className="flex-1" />
                      </div>
                    )}
                    <ButtonLink
                      to={active ? `/olympiads/${attempt.olympiadId}/take` : `/results/${attempt.id}`}
                      variant={active ? 'primary' : 'secondary'}
                      size="sm"
                      className="justify-self-start sm:justify-self-end"
                    >
                      {active ? t('dashboard.continue') : t('dashboard.viewResult')}
                    </ButtonLink>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
