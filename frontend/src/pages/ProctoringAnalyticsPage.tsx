import { ArrowLeft, BarChart3, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { getProctoringReport } from '@/api/proctoring';
import { useLocale, useT } from '@/i18n';
import type { ProctoringEventType, ProctoringReport } from '@/types';
import { cn } from '@/utils/cn';
import { formatShort } from '@/utils/format';
import { RiskBadge } from '@/components/domain/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';

const REFRESH_MS = 10_000;

const COLUMNS: ProctoringEventType[] = ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_MISSING', 'MULTIPLE_FACES', 'COPY_PASTE', 'CAMERA_UNAVAILABLE'];

const TYPE_COLOR: Record<ProctoringEventType, string> = {
  TAB_SWITCH: 'bg-soft/50',
  FULLSCREEN_EXIT: 'bg-soft/30',
  FACE_MISSING: 'bg-risk-mid',
  MULTIPLE_FACES: 'bg-risk-high',
  COPY_PASTE: 'bg-[#4F7BD9]',
  CAMERA_UNAVAILABLE: 'bg-risk-high/70',
  SUSPICIOUS_SOUND: 'bg-soft/40',
  SCREEN_RECORDING: 'bg-risk-high/70',
};

export function ProctoringAnalyticsPage() {
  const t = useT();
  const locale = useLocale();
  const { id: olympiadId = '' } = useParams();
  const [report, setReport] = useState<ProctoringReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        setReport(await getProctoringReport(olympiadId));
      } catch (error) {
        if (!silent) toast.error(errorMessage(error, 'errors.load'));
      } finally {
        setLoading(false);
      }
    },
    [olympiadId],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const maxEvents = useMemo(() => Math.max(1, ...(report?.participants.map((p) => p.totalEvents) ?? [1])), [report]);

  if (loading) return <PageSkeleton />;
  if (!report) return <EmptyState title={t('errors.load')} />;

  const high = report.participants.filter((p) => p.riskLevel === 'HIGH').length;
  const selectedParticipant = report.participants.find((p) => p.email === selected);
  const events = selected ? report.events.filter((event) => event.userEmail === selected) : report.events;

  return (
    <>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-soft hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {t('nav.olympiads')}
      </Link>
      <PageHeader
        title={report.olympiadTitle}
        lead={
          <>
            <span className="font-medium text-fg">{t('proctoring.title')}</span> ·{' '}
            {t('proctoring.summary', {
              events: t('common.events', { count: report.totalEvents }),
              flagged: report.flaggedEvents,
              high,
              participants: report.participants.length,
            })}
          </>
        }
        actions={
          <ButtonLink to={`/admin/olympiads/${olympiadId}/results`} variant="secondary">
            <BarChart3 className="h-4 w-4" />
            {t('proctoring.toResults')}
          </ButtonLink>
        }
      />

      {report.participants.length === 0 ? (
        <EmptyState title={t('proctoring.empty')} />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="participants" className="overflow-hidden rounded-card border border-line bg-surface shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <h2 id="participants" className="font-serif text-xl font-semibold">
                {t('proctoring.participants')}
              </h2>
              <span className="inline-flex items-center gap-2 text-xs text-soft">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                {t('proctoring.live')}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-muted">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-soft">
                    <th className="px-5 py-3">{t('ranking.participant')}</th>
                    <th className="w-[240px] px-3 py-3">{t('proctoring.risk')}</th>
                    {COLUMNS.map((type) => (
                      <th key={type} className="px-2 py-3 text-right" title={t(`proctoring.typesLong.${type}`)}>
                        {t(`proctoring.types.${type}`)}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right">{t('proctoring.lastEvent')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.participants.map((participant) => {
                    const isSelected = participant.email === selected;
                    return (
                      <tr
                        key={participant.email}
                        onClick={() => setSelected(isSelected ? null : participant.email)}
                        aria-selected={isSelected}
                        className={cn('cursor-pointer border-t border-line/70 transition-colors', isSelected ? 'bg-accent-soft' : 'hover:bg-muted')}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold">{participant.fullName}</p>
                          <p className="text-xs text-soft">{participant.email}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <RiskBadge level={participant.riskLevel} />
                            <EventStrip counts={participant.countsByType} max={maxEvents} />
                          </div>
                        </td>
                        {COLUMNS.map((type) => {
                          const count = participant.countsByType[type] ?? 0;
                          return (
                            <td key={type} className={cn('num px-2 py-3.5 text-right font-mono', count ? 'font-semibold' : 'text-soft/50')}>
                              {count || '·'}
                            </td>
                          );
                        })}
                        <td className="px-5 py-3.5 text-right text-soft">{participant.lastEventAt ? formatShort(participant.lastEventAt) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="feed">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="feed" className="font-serif text-xl font-semibold">
                {selectedParticipant ? t('proctoring.feedFor', { name: selectedParticipant.fullName }) : t('proctoring.feed')}
              </h2>
              {selected && (
                <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                  <X className="h-4 w-4" />
                  {t('proctoring.showAll')}
                </button>
              )}
            </div>
            {events.length === 0 ? (
              <EmptyState title={t('proctoring.noEvents')} />
            ) : (
              <ol className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {events.map((event) => (
                  <li key={event.id} className="grid gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[132px_190px_1fr_auto] sm:items-center">
                    <time className="whitespace-nowrap text-[13px] text-soft num" dateTime={event.timestamp}>
                      {formatShort(event.timestamp)}
                    </time>
                    <span className="truncate font-medium">{event.userName}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', TYPE_COLOR[event.eventType])} aria-hidden />
                      <span className="font-medium">{t(`proctoring.typesLong.${event.eventType}`)}</span>
                      {/* Event details are recorded in Russian by the client. */}
                      {event.metadata && locale === 'ru' && <span className="truncate text-soft">— {event.metadata}</span>}
                    </span>
                    <span>{event.flagged ? <Badge tone="high">{t('proctoring.flagged')}</Badge> : <Badge>{t('proctoring.observed')}</Badge>}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </>
  );
}

/** Each event is one segment, colored by type: the participant's session at a glance. */
function EventStrip({ counts, max }: { counts: Partial<Record<ProctoringEventType, number>>; max: number }) {
  const segments = Object.entries(counts).flatMap(([type, count]) =>
    Array.from({ length: count ?? 0 }, (_, index) => ({ type: type as ProctoringEventType, key: `${type}-${index}` })),
  );
  return (
    <div className="flex h-3 flex-1 gap-[2px] overflow-hidden rounded-[4px] bg-fg/[0.06]" aria-hidden>
      {segments.map((segment) => (
        <span key={segment.key} className={cn('h-full', TYPE_COLOR[segment.type])} style={{ width: `${100 / max}%` }} />
      ))}
    </div>
  );
}
