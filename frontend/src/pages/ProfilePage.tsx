import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime } from '@/utils/format';
import { readLocalResults } from '@/utils/localHistory';

export function ProfilePage() {
  const { user } = useAuth();
  const history = readLocalResults().filter((entry) => entry.userEmail === user?.email);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Личный кабинет</p>
        <h1 className="mt-2 text-3xl font-extrabold">{user?.fullName}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoBlock label="Email" value={user?.email ?? '—'} />
          <InfoBlock label="Роль" value={user?.role ?? '—'} />
          <InfoBlock label="История попыток" value={`${history.length}`} />
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <h2 className="text-2xl font-extrabold">История участия</h2>
        {history.length === 0 ? (
          <EmptyState
            title="История пока пуста"
            description="После завершения олимпиады её результат появится здесь автоматически."
          />
        ) : (
          <div className="mt-6 space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.65)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{entry.olympiadTitle}</h3>
                    <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
                      Завершена: {formatDateTime(entry.finishedAt ?? entry.startedAt)}
                    </p>
                  </div>
                  <Badge tone="info">
                    {entry.totalScore} / {entry.maxPossibleScore}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgba(var(--surface-muted),0.72)] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">{label}</p>
      <p className="mt-3 text-lg font-bold">{value}</p>
    </div>
  );
}
