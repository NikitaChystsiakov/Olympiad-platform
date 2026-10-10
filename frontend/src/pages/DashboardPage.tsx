import { BarChart3, ListChecks, Pencil, Plus, Search, ShieldAlert, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { deleteOlympiad, getOlympiads, publishOlympiad } from '@/api/olympiads';
import { getMyAttempts } from '@/api/participations';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { Attempt, Olympiad, OlympiadStatus, PageResponse } from '@/types';
import { formatDuration, formatShort } from '@/utils/format';
import { olympiadPhase } from '@/utils/olympiad';
import { AttemptStatusBadge, OlympiadStatusBadge } from '@/components/domain/StatusBadges';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Chips } from '@/components/ui/Chips';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { Skeleton } from '@/components/ui/Skeleton';

type Filter = '' | Extract<OlympiadStatus, 'PUBLISHED' | 'DRAFT' | 'FINISHED'>;
const PAGE_SIZE = 10;

export function DashboardPage() {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as Filter;
  const search = params.get('search') ?? '';
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);

  const [searchDraft, setSearchDraft] = useState(search);
  const [data, setData] = useState<PageResponse<Olympiad> | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [toDelete, setToDelete] = useState<Olympiad | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateParams = useCallback(
    (next: Partial<{ status: string; search: string; page: number }>) => {
      const merged = { status, search, page, ...next };
      const query = new URLSearchParams();
      if (merged.status) query.set('status', merged.status);
      if (merged.search) query.set('search', merged.search);
      if (merged.page > 0) query.set('page', String(merged.page));
      setParams(query, { replace: true });
    },
    [page, search, setParams, status],
  );

  // Debounced search: typing updates the URL 350 ms after the last keystroke.
  useEffect(() => {
    if (searchDraft === search) return;
    const timer = window.setTimeout(() => updateParams({ search: searchDraft.trim(), page: 0 }), 350);
    return () => window.clearTimeout(timer);
  }, [search, searchDraft, updateParams]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await getOlympiads({ page, size: PAGE_SIZE, status: status || undefined, search: search || undefined }));
    } catch (error) {
      toast.error(errorMessage(error, 'errors.load'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isStudent) return;
    getMyAttempts()
      .then(setAttempts)
      .catch(() => setAttempts([]));
  }, [isStudent]);

  const activeAttemptByOlympiad = useMemo(() => {
    const map = new Map<string, Attempt>();
    attempts?.filter((attempt) => attempt.status === 'ACTIVE').forEach((attempt) => map.set(attempt.olympiadId, attempt));
    return map;
  }, [attempts]);

  const filters: Array<{ value: Filter; label: string }> = [
    { value: '', label: t('dashboard.filters.all') },
    { value: 'PUBLISHED', label: t('dashboard.filters.PUBLISHED') },
    ...(isManager ? [{ value: 'DRAFT' as Filter, label: t('dashboard.filters.DRAFT') }] : []),
    { value: 'FINISHED', label: t('dashboard.filters.FINISHED') },
  ];

  const handlePublish = async (olympiad: Olympiad) => {
    try {
      setBusyId(olympiad.id);
      await publishOlympiad(olympiad.id);
      toast.success(t('dashboard.published'));
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setBusyId(toDelete.id);
      await deleteOlympiad(toDelete.id);
      toast.success(t('dashboard.deleted'));
      setToDelete(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const lead = user?.role === 'ADMIN' ? t('dashboard.leadAdmin') : isManager ? t('dashboard.leadOrganizer') : t('dashboard.leadStudent');
  const olympiads = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const hasFilters = Boolean(status || search);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        lead={lead}
        actions={
          isManager && (
            <ButtonLink to="/olympiads/create">
              <Plus className="h-4 w-4" />
              {t('dashboard.create')}
            </ButtonLink>
          )
        }
      />

      {isStudent && <MyAttempts attempts={attempts} />}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Chips label={t('common.status')} options={filters} value={status} onChange={(value) => updateParams({ status: value, page: 0 })} />
        <label className="relative block md:w-72">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
          <Input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={t('dashboard.searchPlaceholder')}
            className="bg-surface pl-9"
            type="search"
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[168px] w-full rounded-card" />
          ))}
        </div>
      ) : olympiads.length === 0 ? (
        <EmptyState
          title={t('dashboard.emptyTitle')}
          text={hasFilters ? t('dashboard.emptyText') : isManager ? t('dashboard.emptyOrganizer') : t('dashboard.emptyText')}
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchDraft('');
                  updateParams({ status: '', search: '', page: 0 });
                }}
              >
                {t('dashboard.reset')}
              </Button>
            ) : isManager ? (
              <ButtonLink to="/olympiads/create">{t('dashboard.create')}</ButtonLink>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {olympiads.map((olympiad) => (
            <li key={olympiad.id}>
              <OlympiadRow
                olympiad={olympiad}
                role={user?.role}
                activeAttempt={activeAttemptByOlympiad.get(olympiad.id)}
                busy={busyId === olympiad.id}
                onPublish={() => void handlePublish(olympiad)}
                onDelete={() => setToDelete(olympiad)}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="pagination">
          <span className="text-sm text-soft">{t('common.page', { page: page + 1, total: totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => updateParams({ page: page - 1 })}>
              {t('common.prev')}
            </Button>
            <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => updateParams({ page: page + 1 })}>
              {t('common.nextPage')}
            </Button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={t('common.delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={busyId === toDelete?.id}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && t('dashboard.deleteConfirm', { title: toDelete.title })}
      </ConfirmDialog>
    </>
  );
}

function MyAttempts({ attempts }: { attempts: Attempt[] | null }) {
  const t = useT();
  return (
    <section className="mb-10" aria-labelledby="my-attempts">
      <h2 id="my-attempts" className="mb-3 font-serif text-xl font-semibold">
        {t('dashboard.myAttempts')}
      </h2>
      {attempts === null ? (
        <Skeleton className="h-20 w-full rounded-card" />
      ) : attempts.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-5 py-4 text-soft">{t('dashboard.noAttempts')}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-lift">
          {attempts.slice(0, 5).map((attempt) => {
            const score = attempt.score ?? 0;
            const active = attempt.status === 'ACTIVE';
            return (
              <li key={attempt.id} className="grid items-center gap-x-5 gap-y-2 px-5 py-4 sm:grid-cols-[1fr_220px_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{attempt.olympiadTitle}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-soft">
                    <AttemptStatusBadge status={attempt.status} />
                    {formatShort(attempt.finishedAt ?? attempt.startedAt)}
                  </p>
                </div>
                {!active ? (
                  <div className="flex items-center gap-3">
                    <span className="num w-[64px] font-serif text-lg font-semibold">
                      {score}
                      <span className="text-sm font-normal text-soft">/{attempt.maxPossibleScore}</span>
                    </span>
                    <ScoreBar value={score} max={attempt.maxPossibleScore} className="flex-1" />
                  </div>
                ) : (
                  <span />
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
  );
}

interface OlympiadRowProps {
  olympiad: Olympiad;
  role?: string;
  activeAttempt?: Attempt;
  busy: boolean;
  onPublish: () => void;
  onDelete: () => void;
}

function OlympiadRow({ olympiad, role, activeAttempt, busy, onPublish, onDelete }: OlympiadRowProps) {
  const t = useT();
  const phase = olympiadPhase(olympiad);
  const isManager = role === 'ORGANIZER' || role === 'ADMIN';
  const editable = olympiad.status === 'DRAFT' || olympiad.status === 'PUBLISHED';

  return (
    <article className="rounded-card border border-line bg-surface p-5 shadow-lift transition-[border-color] duration-150 hover:border-soft/30 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OlympiadStatusBadge olympiad={olympiad} />
            {role === 'ADMIN' && <span className="text-xs text-soft">{olympiad.createdBy}</span>}
          </div>
          <h2 className="mt-2.5 font-serif text-[22px] font-semibold leading-snug tracking-[-0.01em]">
            {isManager ? (
              <Link to={`/olympiads/${olympiad.id}/questions`} className="hover:underline">
                {olympiad.title}
              </Link>
            ) : (
              olympiad.title
            )}
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-[78ch] text-soft">{olympiad.description}</p>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="label">{t('dashboard.window')}</dt>
              <dd className="mt-0.5 font-medium">
                {formatShort(olympiad.startTime)} — {formatShort(olympiad.endTime)}
              </dd>
            </div>
            <div>
              <dt className="label">{t('dashboard.duration')}</dt>
              <dd className="mt-0.5 font-medium">{formatDuration(olympiad.durationMinutes)}</dd>
            </div>
            <div>
              <dt className="label">{t('dashboard.content')}</dt>
              <dd className="mt-0.5 font-medium">
                {t('common.questions', { count: olympiad.questionCount })} · {t('common.points', { count: olympiad.totalPoints })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">
          {role === 'STUDENT' &&
            (activeAttempt ? (
              <ButtonLink to={`/olympiads/${olympiad.id}/take`} size="lg">
                {t('dashboard.continue')}
              </ButtonLink>
            ) : phase === 'open' ? (
              <ButtonLink to={`/olympiads/${olympiad.id}/take`} size="lg">
                {t('dashboard.start')}
              </ButtonLink>
            ) : phase === 'upcoming' ? (
              <span className="inline-flex h-12 items-center rounded-control bg-muted px-4 text-sm font-semibold text-soft">
                {t('dashboard.startsIn', { date: formatShort(olympiad.startTime) })}
              </span>
            ) : null)}

          {isManager && (
            <>
              <ButtonLink to={`/olympiads/${olympiad.id}/questions`} variant="secondary" size="sm">
                <ListChecks className="h-4 w-4" />
                {t('dashboard.questions')}
              </ButtonLink>
              {olympiad.status !== 'DRAFT' && (
                <>
                  <ButtonLink to={`/admin/olympiads/${olympiad.id}/results`} variant="secondary" size="sm">
                    <BarChart3 className="h-4 w-4" />
                    {t('dashboard.results')}
                  </ButtonLink>
                  <ButtonLink to={`/admin/olympiads/${olympiad.id}/proctoring`} variant="secondary" size="sm">
                    <ShieldAlert className="h-4 w-4" />
                    {t('dashboard.proctoring')}
                  </ButtonLink>
                </>
              )}
              {editable && (
                <ButtonLink to={`/olympiads/${olympiad.id}/edit`} variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </ButtonLink>
              )}
              {olympiad.status === 'DRAFT' && (
                <Button size="sm" onClick={onPublish} loading={busy} disabled={olympiad.questionCount === 0}>
                  <Upload className="h-4 w-4" />
                  {t('dashboard.publish')}
                </Button>
              )}
              {role === 'ADMIN' && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-risk-high hover:bg-risk-high-bg" aria-label={t('common.delete')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
