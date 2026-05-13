import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getParticipationResults } from '@/api/participations';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { useParticipationStore } from '@/store/participationStore';
import type { ParticipationResult } from '@/types';
import { formatDateTime } from '@/utils/format';
import { readLocalResults } from '@/utils/localHistory';

export function ResultsPage() {
  const { participationId } = useParams();
  const { result: storedResult, setResult } = useParticipationStore();
  const initialResult = storedResult?.id === participationId ? storedResult : null;
  const [result, setLocalResult] = useState<ParticipationResult | null>(initialResult);
  const [isLoading, setIsLoading] = useState(!initialResult);

  useEffect(() => {
    if (!participationId) return;
    if (storedResult?.id === participationId) return;

    void (async () => {
      try {
        setIsLoading(true);
        const serverResult = await getParticipationResults(participationId);
        const localMatch = readLocalResults().find((entry) => entry.id === participationId);
        const merged = mergeServerAndLocalResults(serverResult, localMatch);
        setResult(merged);
        setLocalResult(merged);
      } catch {
        const fallback = readLocalResults().find((entry) => entry.id === participationId) ?? null;
        if (!fallback) {
          toast.error('Не удалось загрузить результат');
        }
        setLocalResult(fallback);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [participationId, setResult, storedResult]);

  if (isLoading) return <Loader />;
  if (!result) {
    return (
      <EmptyState
        title="Результат пока недоступен"
        description="Не удалось получить данные попытки. Попробуйте открыть результат позже."
      />
    );
  }

  const solved = result.totalScore;
  const remaining = Math.max(result.maxPossibleScore - solved, 0);
  const percent = result.maxPossibleScore > 0 ? Math.round((solved / result.maxPossibleScore) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="grid gap-6 rounded-[28px] lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Результаты</p>
          <h1 className="mt-2 text-3xl font-extrabold">{result.olympiadTitle}</h1>
          <p className="mt-3 text-sm text-[rgb(var(--text-soft))]">
            Попытка завершена: {formatDateTime(result.finishedAt ?? result.startedAt)}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-[rgb(var(--text-soft))]">Итоговый балл</p>
              <p className="text-4xl font-extrabold">
                {result.totalScore} / {result.maxPossibleScore}
              </p>
            </div>
            <Badge tone={percent >= 60 ? 'success' : 'warning'}>{percent}% выполнения</Badge>
            {result.pendingReview && <Badge tone="info">Ожидает проверки</Badge>}
            {!result.pendingReview && result.place && <Badge tone="success">{result.place} место</Badge>}
          </div>
          {result.pendingReview && (
            <p className="mt-4 rounded-2xl bg-[rgba(var(--surface-muted),0.75)] p-4 text-sm leading-6 text-[rgb(var(--text-soft))]">
              Решение передано организаторам. Итоговый балл и место появятся после ручной проверки задач.
            </p>
          )}
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[rgba(var(--surface-muted),0.9)]">
            <div className="h-full rounded-full bg-[rgb(var(--primary))]" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Баллы', value: solved },
                  { name: 'Осталось', value: remaining },
                ]}
                dataKey="value"
                innerRadius={68}
                outerRadius={100}
              >
                <Cell fill="rgb(var(--primary))" />
                <Cell fill="rgba(var(--surface-muted),0.9)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <h2 className="text-2xl font-extrabold">Детали по вопросам</h2>
        {result.answers.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-[rgb(var(--text-soft))]">
            По этой попытке пока нет сохраненных ответов.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {result.answers.map((answer, index) => (
              <div
                key={answer.questionId}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.65)] p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold">
                    {index + 1}. {answer.questionText}
                  </h3>
                  <Badge tone={answer.pendingReview ? 'info' : answer.isCorrect ? 'success' : 'warning'}>
                    {answer.pendingReview ? 'На проверке' : `${answer.pointsEarned} / ${answer.maxPoints ?? 0} балл.`}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <AnswerBlock label="Ваш ответ" value={answer.userAnswer} />
                  <AnswerBlock label="Правильный ответ" value={answer.correctAnswer} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AnswerBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-[rgba(var(--surface-muted),0.7)] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold">{formatAnswerValue(value)}</p>
    </div>
  );
}

function formatAnswerValue(value?: string) {
  if (!value) return '-';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // Plain text answer.
  }
  return value.split('|').join(', ');
}

function mergeServerAndLocalResults(serverResult: ParticipationResult, localResult?: ParticipationResult) {
  if (!localResult) return serverResult;
  if (serverResult.answers.length === 0) return localResult;

  const localAnswersByQuestionId = new Map(localResult.answers.map((answer) => [answer.questionId, answer]));
  return {
    ...serverResult,
    answers: serverResult.answers.map((answer) => ({
      ...answer,
      userAnswer: answer.userAnswer || localAnswersByQuestionId.get(answer.questionId)?.userAnswer || '',
    })),
  };
}
