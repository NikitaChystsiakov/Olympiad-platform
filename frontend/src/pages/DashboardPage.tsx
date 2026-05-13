import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteOlympiad, publishOlympiad } from '@/api/olympiads';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useOlympiadStore } from '@/store/olympiadStore';
import type { OlympiadStatus } from '@/types';
import { formatDateTime, formatDurationFromMinutes } from '@/utils/format';

const statuses: Array<{ label: string; value: OlympiadStatus | '' }> = [
  { label: 'Все статусы', value: '' },
  { label: 'Черновик', value: 'DRAFT' },
  { label: 'Опубликована', value: 'PUBLISHED' },
  { label: 'Активна', value: 'ACTIVE' },
  { label: 'Завершена', value: 'FINISHED' },
];

const toneMap: Record<OlympiadStatus, 'neutral' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ACTIVE: 'info',
  FINISHED: 'neutral',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    olympiads,
    page,
    totalPages,
    status,
    search,
    isLoading,
    setPage,
    setSearch,
    setStatus,
    fetchOlympiads,
  } = useOlympiadStore();
  const [searchValue, setSearchValue] = useState(search);

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get('page') ?? '0');
    const statusFromUrl = (searchParams.get('status') ?? '') as OlympiadStatus | '';
    const searchFromUrl = searchParams.get('search') ?? '';

    setPage(Number.isFinite(pageFromUrl) && pageFromUrl >= 0 ? pageFromUrl : 0);
    setStatus(statusFromUrl);
    setSearch(searchFromUrl);
    setSearchValue(searchFromUrl);
  }, []);

  useEffect(() => {
    void fetchOlympiads();
  }, [fetchOlympiads, page, status, search]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (page > 0) next.set('page', String(page));
    if (status) next.set('status', status);
    if (search) next.set('search', search);
    setSearchParams(next, { replace: true });
  }, [page, search, setSearchParams, status]);

  const handlePublish = async (id: string) => {
    try {
      await publishOlympiad(id);
      toast.success('Олимпиада опубликована');
      await fetchOlympiads();
    } catch {
      toast.error('Не удалось опубликовать олимпиаду');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOlympiad(id);
      toast.success('Олимпиада удалена');
      await fetchOlympiads();
    } catch {
      toast.error('Не удалось удалить олимпиаду');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-none bg-hero-mesh p-7 dark:bg-hero-mesh-dark">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[rgb(var(--primary))]">Рабочая панель</p>
            <h1 className="mt-2 text-3xl font-extrabold">Мои олимпиады</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--text-soft))]">
              Управляйте расписанием, вопросами, публикацией и участием в олимпиадах из одного места.
            </p>
          </div>
          {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
            <Link to="/olympiads/create">
              <Button>Создать олимпиаду</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          <label className="mb-2 block text-sm font-semibold">Поиск</label>
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onBlur={() => {
              setPage(0);
              setSearch(searchValue);
            }}
            placeholder="Поиск по названию олимпиады"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Статус</label>
          <Select
            value={status}
            onChange={(event) => {
              setPage(0);
              setStatus(event.target.value as OlympiadStatus | '');
            }}
          >
            {statuses.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Loader />
      ) : olympiads.length === 0 ? (
        <EmptyState
          title="Олимпиады пока не найдены"
          description="Измените фильтры или создайте первую олимпиаду, чтобы наполнить систему."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {olympiads.map((olympiad) => (
            <OlympiadCard
              key={olympiad.id}
              olympiad={olympiad}
              userRole={user?.role}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onTake={(id) => navigate(`/olympiads/${id}/take`)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--text-soft))]">Страница {page + 1}</p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Назад
          </Button>
          <Button
            variant="secondary"
            disabled={totalPages === 0 || page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
}

function OlympiadCard({
  olympiad,
  userRole,
  onDelete,
  onPublish,
  onTake,
}: {
  olympiad: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: OlympiadStatus;
    createdBy: string;
  };
  userRole?: string;
  onDelete: (id: string) => Promise<void>;
  onPublish: (id: string) => Promise<void>;
  onTake: (id: string) => void;
}) {
  const now = Date.now();
  const startsAt = new Date(olympiad.startTime).getTime();
  const endsAt = new Date(olympiad.endTime).getTime();
  const canStartNow =
    (olympiad.status === 'PUBLISHED' || olympiad.status === 'ACTIVE') &&
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    now >= startsAt &&
    now <= endsAt;
  const studentCanSeeTake = userRole === 'STUDENT' && (olympiad.status === 'PUBLISHED' || olympiad.status === 'ACTIVE');

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{olympiad.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[rgb(var(--text-soft))]">
              {olympiad.description}
            </p>
          </div>
          <Badge tone={toneMap[olympiad.status]}>{olympiad.status}</Badge>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Начать можно с" value={formatDateTime(olympiad.startTime)} />
          <Meta label="Начать можно до" value={formatDateTime(olympiad.endTime)} />
          <Meta label="Длительность" value={formatDurationFromMinutes(olympiad.durationMinutes)} />
          <Meta label="Организатор" value={olympiad.createdBy} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {studentCanSeeTake && (
          <Button disabled={!canStartNow} onClick={() => onTake(olympiad.id)}>
            {canStartNow ? 'Участвовать' : 'Окно старта закрыто'}
          </Button>
        )}

        {(userRole === 'ORGANIZER' || userRole === 'ADMIN') && (
          <>
            <Link to={`/olympiads/${olympiad.id}/edit`}>
              <Button variant="secondary">Редактировать</Button>
            </Link>
            <Link to={`/olympiads/${olympiad.id}/questions`}>
              <Button variant="secondary">Вопросы</Button>
            </Link>
            <Link to={`/admin/olympiads/${olympiad.id}/proctoring`}>
              <Button variant="ghost">Прокторинг</Button>
            </Link>
            <Link to={`/admin/olympiads/${olympiad.id}/results`}>
              <Button variant="ghost">Результаты</Button>
            </Link>
            {olympiad.status === 'DRAFT' && (
              <Button variant="ghost" onClick={() => void onPublish(olympiad.id)}>
                Опубликовать
              </Button>
            )}
          </>
        )}

        {userRole === 'ADMIN' && (
          <Button variant="danger" onClick={() => void onDelete(olympiad.id)}>
            Удалить
          </Button>
        )}
      </div>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgba(var(--surface-muted),0.72)] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
