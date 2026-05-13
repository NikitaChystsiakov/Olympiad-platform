import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getManualReviewQueue, getOlympiadParticipants, reviewAnswer } from '@/api/participations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Textarea } from '@/components/ui/Textarea';
import type { ManualReviewItem, OlympiadParticipant } from '@/types';
import { formatDateTime } from '@/utils/format';

export function OlympiadResultsPage() {
  const { id: olympiadId } = useParams();
  const [participants, setParticipants] = useState<OlympiadParticipant[]>([]);
  const [reviewItems, setReviewItems] = useState<ManualReviewItem[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!olympiadId) return;
    void loadData(olympiadId);
  }, [olympiadId]);

  const loadData = async (currentOlympiadId: string) => {
    try {
      setIsLoading(true);
      const [participantsList, reviewList] = await Promise.all([
        getOlympiadParticipants(currentOlympiadId),
        getManualReviewQueue(currentOlympiadId),
      ]);
      setParticipants(participantsList);
      setReviewItems(reviewList);
      setScores(Object.fromEntries(reviewList.map((item) => [item.answerId, `${item.pointsEarned ?? 0}`])));
      setComments(Object.fromEntries(reviewList.map((item) => [item.answerId, item.reviewComment ?? ''])));
    } catch {
      toast.error('Не удалось загрузить результаты олимпиады');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (item: ManualReviewItem) => {
    if (!olympiadId) return;
    const points = Number(scores[item.answerId] ?? 0);
    if (!Number.isFinite(points) || points < 0 || points > item.maxPoints) {
      toast.error(`Баллы должны быть от 0 до ${item.maxPoints}`);
      return;
    }

    try {
      await reviewAnswer(item.answerId, {
        pointsEarned: points,
        reviewComment: comments[item.answerId],
      });
      toast.success('Оценка сохранена');
      await loadData(olympiadId);
    } catch {
      toast.error('Не удалось сохранить оценку');
    }
  };

  if (isLoading) return <Loader />;

  const winners = participants.filter((item) => item.place && item.place <= 3);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px]">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Итоги олимпиады</p>
        <h1 className="mt-2 text-3xl font-extrabold">Победители и участники</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {winners.length === 0 ? (
            <p className="text-sm text-[rgb(var(--text-soft))]">Победители появятся после завершения и проверки попыток.</p>
          ) : (
            winners.map((winner) => (
              <div key={winner.participationId} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                <Badge tone="success">{winner.place} место</Badge>
                <p className="mt-3 font-bold">{winner.userName}</p>
                <p className="text-sm text-[rgb(var(--text-soft))]">{winner.score} / {winner.maxPossibleScore}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <h2 className="text-2xl font-extrabold">Все участники</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">
              <tr>
                <th className="border-b border-[rgb(var(--border))] px-3 py-3">Место</th>
                <th className="border-b border-[rgb(var(--border))] px-3 py-3">Участник</th>
                <th className="border-b border-[rgb(var(--border))] px-3 py-3">Баллы</th>
                <th className="border-b border-[rgb(var(--border))] px-3 py-3">Завершил</th>
                <th className="border-b border-[rgb(var(--border))] px-3 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.participationId}>
                  <td className="border-b border-[rgba(var(--border),0.6)] px-3 py-3">
                    {participant.place ?? '-'}
                  </td>
                  <td className="border-b border-[rgba(var(--border),0.6)] px-3 py-3">
                    <p className="font-semibold">{participant.userName}</p>
                    <p className="text-xs text-[rgb(var(--text-soft))]">{participant.userEmail}</p>
                  </td>
                  <td className="border-b border-[rgba(var(--border),0.6)] px-3 py-3">
                    {participant.score} / {participant.maxPossibleScore}
                  </td>
                  <td className="border-b border-[rgba(var(--border),0.6)] px-3 py-3">
                    {participant.finishedAt ? formatDateTime(participant.finishedAt) : '-'}
                  </td>
                  <td className="border-b border-[rgba(var(--border),0.6)] px-3 py-3">
                    <Badge tone={participant.pendingReview ? 'info' : participant.status === 'FINISHED' ? 'success' : 'warning'}>
                      {participant.pendingReview ? 'На проверке' : participant.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <h2 className="text-2xl font-extrabold">Ручная проверка</h2>
        {reviewItems.length === 0 ? (
          <p className="mt-4 text-sm text-[rgb(var(--text-soft))]">Ответов для ручной проверки пока нет.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {reviewItems.map((item) => (
              <div key={item.answerId} className="rounded-2xl border border-[rgb(var(--border))] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.userName}</p>
                    <p className="text-sm text-[rgb(var(--text-soft))]">{item.questionText}</p>
                  </div>
                  <Badge tone={item.pointsEarned == null ? 'info' : 'success'}>
                    {item.pointsEarned == null ? 'Не проверено' : `${item.pointsEarned} / ${item.maxPoints}`}
                  </Badge>
                </div>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[rgba(var(--surface-muted),0.75)] p-4 text-sm">
                  {item.userAnswer || '-'}
                </pre>
                <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Баллы</label>
                    <Input
                      type="number"
                      min={0}
                      max={item.maxPoints}
                      value={scores[item.answerId] ?? ''}
                      onChange={(event) => setScores((current) => ({ ...current, [item.answerId]: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Комментарий</label>
                    <Textarea
                      value={comments[item.answerId] ?? ''}
                      onChange={(event) => setComments((current) => ({ ...current, [item.answerId]: event.target.value }))}
                    />
                  </div>
                  <Button onClick={() => void handleReview(item)}>Сохранить</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
