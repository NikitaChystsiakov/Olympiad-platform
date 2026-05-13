import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOlympiadById } from '@/api/olympiads';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import type { LocalProctoringEntry } from '@/types';
import { formatDateTime } from '@/utils/format';
import { readLocalProctoringEvents } from '@/utils/localHistory';

export function ProctoringAnalyticsPage() {
  const { id: olympiadId } = useParams();
  const [title, setTitle] = useState('');
  const [events, setEvents] = useState<LocalProctoringEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!olympiadId) return;

    void (async () => {
      try {
        setIsLoading(true);
        const olympiad = await getOlympiadById(olympiadId);
        setTitle(olympiad.title);
      } finally {
        const stored = readLocalProctoringEvents().filter((entry) => entry.olympiadId === olympiadId);
        setEvents(stored);
        setIsLoading(false);
      }
    })();
  }, [olympiadId]);

  if (isLoading) return <Loader />;

  const participants = Array.from(
    new Map(
      events.map((event) => [
        event.userEmail,
        {
          userEmail: event.userEmail,
          userName: event.userName,
          suspicious: events.some((item) => item.userEmail === event.userEmail && item.isFlagged),
          eventsCount: events.filter((item) => item.userEmail === event.userEmail).length,
        },
      ]),
    ).values(),
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Прокторинг</p>
        <h1 className="mt-2 text-3xl font-extrabold">{title || 'Аналитика прокторинга'}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--text-soft))]">
          Сервер пока не отдаёт отдельный эндпоинт аналитики, поэтому эта страница показывает события,
          которые фронтенд сохранил локально во время прохождения олимпиады.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit rounded-[28px]">
          <h2 className="text-xl font-extrabold">Участники</h2>
          {participants.length === 0 ? (
            <p className="mt-4 text-sm text-[rgb(var(--text-soft))]">Пока нет локально сохранённых попыток.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.userEmail}
                  className="rounded-2xl border border-[rgb(var(--border))] p-4"
                >
                  <p className="font-semibold">{participant.userName}</p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-soft))]">{participant.userEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={participant.suspicious ? 'danger' : 'success'}>
                      {participant.suspicious ? 'Подозрительный' : 'Без критичных флагов'}
                    </Badge>
                    <Badge tone="neutral">{participant.eventsCount} событий</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-[28px]">
          <h2 className="text-xl font-extrabold">События</h2>
          {events.length === 0 ? (
            <EmptyState
              title="События не найдены"
              description="После прохождения олимпиады участниками здесь появятся tab switch, fullscreen exit и другие сигналы."
            />
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[rgb(var(--border))]">
              <div className="grid grid-cols-[1.2fr_1fr_1.6fr_140px] gap-4 border-b border-[rgb(var(--border))] bg-[rgba(var(--surface-muted),0.72)] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">
                <span>Участник</span>
                <span>Событие</span>
                <span>Описание</span>
                <span>Флаг</span>
              </div>
              {events.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-[1.2fr_1fr_1.6fr_140px] gap-4 border-b border-[rgba(var(--border),0.6)] px-5 py-4 text-sm last:border-b-0"
                >
                  <div>
                    <p className="font-semibold">{event.userName}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-soft))]">{formatDateTime(event.createdAt)}</p>
                  </div>
                  <p>{event.eventType}</p>
                  <p className="text-[rgb(var(--text-soft))]">{event.metadata}</p>
                  <div>
                    <Badge tone={event.isFlagged ? 'danger' : 'info'}>
                      {event.isFlagged ? 'Подозрительно' : 'Наблюдение'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
