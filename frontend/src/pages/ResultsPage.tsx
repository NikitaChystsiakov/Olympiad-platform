import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '@/api/http';
import { getParticipationResults } from '@/api/participations';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { AnswerDetail, ParticipationResult } from '@/types';
import { cn } from '@/utils/cn';
import { formatAnswer, formatDateTime } from '@/utils/format';
import { AttemptStatusBadge } from '@/components/domain/StatusBadges';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { PageSkeleton } from '@/components/ui/Skeleton';

type Verdict = 'correct' | 'wrong' | 'partial' | 'pending' | 'empty';

function verdictOf(answer: AnswerDetail): Verdict {
  if (answer.pendingReview) return 'pending';
  if (!answer.userAnswer?.trim()) return 'empty';
  if (answer.isCorrect) return 'correct';
  if (answer.pointsEarned > 0) return 'partial';
  return 'wrong';
}

const verdictTone: Record<Verdict, BadgeTone> = {
  correct: 'low',
  wrong: 'high',
  partial: 'mid',
  pending: 'neutral',
  empty: 'neutral',
};

export function ResultsPage() {
  const t = useT();
  const { participationId = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const [result, setResult] = useState<ParticipationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getParticipationResults(participationId)
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'errors.load')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [participationId]);

  if (loading) return <PageSkeleton />;

  if (!result) {
    return (
      <EmptyState
        title={t('results.unavailable')}
        text={error ?? t('results.unavailableText')}
        action={<ButtonLink to="/dashboard">{t('results.toList')}</ButtonLink>}
      />
    );
  }

  const isOwner = user?.email === result.userEmail;
  const backTo = isOwner ? '/dashboard' : `/admin/olympiads/${result.olympiadId}/results`;
  const percent = result.maxPossibleScore > 0 ? Math.round((result.totalScore / result.maxPossibleScore) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-soft hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          {isOwner ? t('results.toList') : t('ranking.title')}
        </Link>
        <h1 className="mt-4 font-serif text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">{result.olympiadTitle}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-soft">
          {!isOwner && <span className="font-medium text-fg">{result.userName}</span>}
          <AttemptStatusBadge status={result.status} />
          {t('results.finishedAt', { date: formatDateTime(result.finishedAt ?? result.startedAt) })}
        </p>
      </div>

      <section className="grid gap-6 rounded-card border border-line bg-surface p-6 shadow-lift sm:p-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <div>
          <p className="label">{t('results.score')}</p>
          <p className="num mt-1 font-serif text-[64px] font-semibold leading-none tracking-[-0.03em] sm:text-[80px]">
            {result.totalScore}
            <span className="text-[0.45em] font-medium text-soft"> / {result.maxPossibleScore}</span>
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="num font-mono text-sm font-semibold">{percent}%</span>
            {result.place && !result.pendingReview && (
              <Badge tone="marker" className="text-sm">
                {t('results.placeShort', { place: result.place })}
              </Badge>
            )}
          </div>
          <ScoreBar value={result.totalScore} max={result.maxPossibleScore} tone="accent" className="h-4" />
          {result.pendingReview && <p className="text-sm text-soft">{t('results.pending')}</p>}
        </div>
      </section>

      <section aria-labelledby="breakdown">
        <h2 id="breakdown" className="mb-4 font-serif text-2xl font-semibold">
          {t('results.breakdown')}
        </h2>
        <ol className="space-y-3">
          {result.answers.map((answer, index) => {
            const verdict = verdictOf(answer);
            const manual = answer.questionType === 'MANUAL_REVIEW' || answer.questionType === 'CODE';
            const isCode = answer.questionType === 'CODE';
            return (
              <li key={answer.questionId} className="rounded-card border border-line bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                        verdict === 'correct' && 'bg-risk-low-bg text-risk-low',
                        verdict === 'wrong' && 'bg-risk-high-bg text-risk-high',
                        verdict === 'partial' && 'bg-risk-mid-bg text-risk-mid',
                        (verdict === 'pending' || verdict === 'empty') && 'bg-muted text-soft',
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="pt-1 font-medium leading-snug">{answer.questionText}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                    <Badge tone={verdictTone[verdict]}>{t(`results.verdict.${verdict}`)}</Badge>
                    <span className="num font-mono text-sm font-semibold">
                      {verdict === 'pending' ? '—' : answer.pointsEarned}/{answer.maxPoints}
                    </span>
                  </div>
                </div>

                <div className={cn('mt-4 grid gap-3 pl-11', !manual && answer.correctAnswer && 'md:grid-cols-2')}>
                  <AnswerBox label={t('results.yourAnswer')} value={formatAnswer(answer.userAnswer)} empty={t('results.noAnswer')} mono={isCode} />
                  {!manual && answer.correctAnswer && <AnswerBox label={t('results.correctAnswer')} value={formatAnswer(answer.correctAnswer)} />}
                </div>

                {answer.reviewComment && (
                  <div className="mt-3 ml-11 flex gap-3 rounded-control bg-accent-soft px-4 py-3 text-sm">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="font-semibold">{t('results.reviewer')}</p>
                      <p className="mt-0.5">{answer.reviewComment}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function AnswerBox({ label, value, empty, mono }: { label: string; value: string; empty?: string; mono?: boolean }) {
  return (
    <div className="rounded-control bg-muted px-4 py-3">
      <p className="label">{label}</p>
      {value ? (
        <p className={cn('mt-1 whitespace-pre-wrap break-words', mono ? 'max-h-64 overflow-auto font-mono text-[13px]' : 'font-medium')}>{value}</p>
      ) : (
        <p className="mt-1 text-soft">{empty}</p>
      )}
    </div>
  );
}
