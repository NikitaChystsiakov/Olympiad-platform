import { ArrowLeft, Download, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadAttachment } from '@/api/attachments';
import { errorMessage } from '@/api/http';
import { getOlympiadById } from '@/api/olympiads';
import { getManualReviewQueue, getOlympiadParticipants, reviewAnswer } from '@/api/participations';
import { getProctoringReport } from '@/api/proctoring';
import { useT } from '@/i18n';
import type { ManualReviewItem, Olympiad, OlympiadParticipant, RiskLevel } from '@/types';
import { cn } from '@/utils/cn';
import { formatShort } from '@/utils/format';
import { FileIcon } from '@/components/domain/FileUploader';
import { AttemptStatusBadge, RiskBadge } from '@/components/domain/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Chips } from '@/components/ui/Chips';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { PageSkeleton } from '@/components/ui/Skeleton';

type Tab = 'ranking' | 'review';

/** Code answers keep their indentation in a monospace face; prose stays in the UI face. */
function looksLikeCode(text?: string) {
  return Boolean(text && /\n\s{2,}|[{};]\s*$|^\s*(def|function|class|public|#include|import)\b/m.test(text));
}

export function OlympiadResultsPage() {
  const t = useT();
  const { id: olympiadId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'ranking';
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [participants, setParticipants] = useState<OlympiadParticipant[]>([]);
  const [queue, setQueue] = useState<ManualReviewItem[]>([]);
  const [risk, setRisk] = useState<Record<string, RiskLevel>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [loadedOlympiad, list, review] = await Promise.all([
        getOlympiadById(olympiadId),
        getOlympiadParticipants(olympiadId),
        getManualReviewQueue(olympiadId),
      ]);
      setOlympiad(loadedOlympiad);
      setParticipants(list);
      setQueue(review);
      // Risk is secondary data: the ranking still renders if the report fails.
      getProctoringReport(olympiadId)
        .then((report) => setRisk(Object.fromEntries(report.participants.map((p) => [p.email, p.riskLevel]))))
        .catch(() => undefined);
    } catch (error) {
      toast.error(errorMessage(error, 'errors.load'));
    } finally {
      setLoading(false);
    }
  }, [olympiadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton />;

  const ungraded = queue.filter((item) => item.pointsEarned == null).length;
  const sortedQueue = [...queue].sort((a, b) => Number(a.pointsEarned != null) - Number(b.pointsEarned != null));

  return (
    <>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-soft hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {t('nav.olympiads')}
      </Link>
      <PageHeader
        title={olympiad?.title ?? t('ranking.title')}
        lead={`${t('ranking.title')} · ${t('common.participants', { count: participants.length })}`}
        actions={
          <ButtonLink to={`/admin/olympiads/${olympiadId}/proctoring`} variant="secondary">
            <ShieldAlert className="h-4 w-4" />
            {t('ranking.toProctoring')}
          </ButtonLink>
        }
      />

      <Chips<Tab>
        label={t('ranking.title')}
        className="mb-5"
        value={tab}
        onChange={(value) => setParams(value === 'ranking' ? {} : { tab: value }, { replace: true })}
        options={[
          { value: 'ranking', label: t('ranking.tabRanking'), count: participants.length },
          { value: 'review', label: t('ranking.tabReview'), count: ungraded },
        ]}
      />

      {tab === 'ranking' ? <RankingTable participants={participants} risk={risk} /> : <ReviewQueue items={sortedQueue} onGraded={load} />}
    </>
  );
}

function RankingTable({ participants, risk }: { participants: OlympiadParticipant[]; risk: Record<string, RiskLevel> }) {
  const t = useT();
  const navigate = useNavigate();
  if (participants.length === 0) return <EmptyState title={t('ranking.empty')} />;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-lift">
      <div className="hidden grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1.4fr)_120px_120px_130px] gap-x-3 bg-muted px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-soft md:grid">
        <span>{t('ranking.place')}</span>
        <span>{t('ranking.participant')}</span>
        <span>{t('ranking.score')}</span>
        <span>{t('proctoring.risk')}</span>
        <span>{t('ranking.finished')}</span>
        <span className="text-right">{t('ranking.status')}</span>
      </div>
      <ol>
        {participants.map((row) => {
          const level = risk[row.userEmail];
          return (
            <li key={row.participationId} className="border-t border-line/70 first:border-t-0 md:first:border-t">
              <button
                type="button"
                onClick={() => navigate(`/results/${row.participationId}`)}
                className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-muted md:grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1.4fr)_120px_120px_130px] md:px-5"
              >
                <span
                  className={cn(
                    'grid h-8 w-10 place-items-center rounded-[8px] font-mono text-sm font-semibold',
                    row.place && row.place <= 3 ? 'bg-marker text-[#3A3000]' : 'text-soft',
                  )}
                >
                  {row.place ? String(row.place).padStart(2, '0') : '—'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{row.userName}</span>
                  <span className="block truncate text-xs text-soft">{row.userEmail}</span>
                </span>
                <span className="col-span-3 flex items-center gap-3 md:col-span-1">
                  <span className="num w-[60px] font-serif text-lg font-semibold">
                    {row.score}
                    <span className="text-sm font-normal text-soft">/{row.maxPossibleScore}</span>
                  </span>
                  <ScoreBar value={row.score} max={row.maxPossibleScore} className="flex-1" />
                </span>
                <span className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto">
                  {level ? <RiskBadge level={level} /> : <span className="text-soft">—</span>}
                </span>
                <span className="hidden text-sm text-soft md:block">{formatShort(row.finishedAt)}</span>
                <span className="col-span-3 flex items-center justify-between gap-2 text-sm text-soft md:col-span-1 md:justify-end">
                  <span className="md:hidden">{formatShort(row.finishedAt)}</span>
                  <AttemptStatusBadge status={row.status} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ReviewQueue({ items, onGraded }: { items: ManualReviewItem[]; onGraded: () => Promise<void> }) {
  const t = useT();
  if (items.length === 0) return <EmptyState title={t('ranking.reviewEmpty')} />;

  return (
    <div className="space-y-4">
      <p className="text-soft">{t('ranking.reviewLead')}</p>
      {items.map((item) => (
        <ReviewCard key={item.answerId} item={item} onGraded={onGraded} />
      ))}
    </div>
  );
}

function ReviewCard({ item, onGraded }: { item: ManualReviewItem; onGraded: () => Promise<void> }) {
  const t = useT();
  const [points, setPoints] = useState(item.pointsEarned != null ? String(item.pointsEarned) : '');
  const [comment, setComment] = useState(item.reviewComment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graded = item.pointsEarned != null;

  const save = async () => {
    const value = Number(points);
    if (points === '' || !Number.isInteger(value) || value < 0 || value > item.maxPoints) {
      setError(t('ranking.gradeRange', { max: item.maxPoints }));
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await reviewAnswer(item.answerId, { pointsEarned: value, reviewComment: comment.trim() || undefined });
      toast.success(t('ranking.graded'));
      await onGraded();
    } catch (err) {
      toast.error(errorMessage(err, 'errors.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.userName}</p>
          <p className="text-sm text-soft">{item.questionText}</p>
        </div>
        {graded ? (
          <Badge tone="low">
            {item.pointsEarned}/{item.maxPoints}
          </Badge>
        ) : (
          <Badge tone="mid">{t('ranking.notGraded')}</Badge>
        )}
      </div>

      <div className="mt-4 rounded-control bg-muted px-4 py-3">
        <p className="label">{t('ranking.answer')}</p>
        <p className={cn('mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-words leading-relaxed', looksLikeCode(item.userAnswer) && 'font-mono text-[13px]')}>
          {item.userAnswer || '—'}
        </p>
      </div>

      {item.files && item.files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => void downloadAttachment(file).catch((err) => toast.error(errorMessage(err)))}
              className="inline-flex h-9 items-center gap-2 rounded-control border border-line px-3 text-sm font-medium hover:bg-muted"
            >
              <FileIcon mimeType={file.mimeType} className="text-soft" />
              <span className="max-w-[220px] truncate">{file.originalName}</span>
              <Download className="h-3.5 w-3.5 text-soft" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 border-t border-line pt-5 md:grid-cols-[140px_1fr_auto] md:items-end">
        <Field label={`${t('ranking.points')} (0–${item.maxPoints})`} htmlFor={`points-${item.answerId}`} error={error ?? undefined}>
          <Input
            id={`points-${item.answerId}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={item.maxPoints}
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Field label={t('ranking.comment')} htmlFor={`comment-${item.answerId}`}>
          <Textarea
            id={`comment-${item.answerId}`}
            rows={1}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('ranking.commentPlaceholder')}
            className="min-h-10"
          />
        </Field>
        <Button onClick={() => void save()} loading={saving} variant={graded ? 'secondary' : 'primary'}>
          {t('ranking.saveGrade')}
        </Button>
      </div>
    </article>
  );
}
