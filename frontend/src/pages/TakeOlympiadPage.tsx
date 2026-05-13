import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getOlympiadById, getQuestions } from '@/api/olympiads';
import { finishParticipation, getParticipationResults, startParticipation, submitAnswer } from '@/api/participations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProctoring } from '@/hooks/useProctoring';
import { useParticipationStore } from '@/store/participationStore';
import type { ParticipationResult, Question } from '@/types';
import { formatDurationFromMinutes } from '@/utils/format';
import { pushLocalParticipation, saveLocalResult } from '@/utils/localHistory';

export function TakeOlympiadPage() {
  const { id: olympiadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeParticipation,
    questions,
    answers,
    setActiveParticipation,
    setQuestions,
    setAnswer,
    resetSession,
    setResult,
  } = useParticipationStore();
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const isFinishingRef = useRef(false);
  const submitTimersRef = useRef<Record<string, number>>({});

  useProctoring({
    olympiadId: olympiadId ?? '',
    enabled: Boolean(olympiadId && activeParticipation && !isFinishing),
    user,
  });

  useEffect(() => {
    if (!olympiadId) return;

    void (async () => {
      try {
        setIsLoading(true);
        resetSession();
        setSecondsLeft(null);
        setDeadlineMs(null);
        const [olympiad, questionList, participation] = await Promise.all([
          getOlympiadById(olympiadId),
          getQuestions(olympiadId),
          startParticipation(olympiadId),
        ]);
        setTitle(olympiad.title);
        setDurationMinutes(olympiad.durationMinutes);
        const deadline = calculateDeadlineMs(participation.startedAt, olympiad.durationMinutes);
        setDeadlineMs(deadline);
        setSecondsLeft(calculateSecondsLeft(deadline));
        setQuestions(questionList);
        setActiveParticipation(participation);
        pushLocalParticipation(participation);
        await requestFullscreen();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Не удалось начать участие');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [olympiadId, navigate, resetSession, setActiveParticipation, setQuestions]);

  useEffect(() => {
    if (!activeParticipation || isFinishingRef.current) return;
    if (deadlineMs === null) return;

    const updateTimer = () => {
      const nextSecondsLeft = calculateSecondsLeft(deadlineMs);
      setSecondsLeft(nextSecondsLeft);
      if (nextSecondsLeft <= 0 && !isFinishingRef.current) {
        void finalizeParticipation(true);
      }
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [activeParticipation?.id, deadlineMs]);

  useEffect(() => {
    return () => {
      Object.values(submitTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      submitTimersRef.current = {};
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  const maxPossibleScore = useMemo(
    () => questions.reduce((sum, question) => sum + question.points, 0),
    [questions],
  );

  const handleAnswerChange = (question: Question, value: string) => {
    setAnswer(question.id, value);
    if (!activeParticipation) {
      return;
    }

    const payload = {
      participationId: activeParticipation.id,
      questionId: question.id,
      answer: value,
    };

    const sendAnswer = () => {
      if (isFinishingRef.current) return;
      void submitAnswer(payload).catch(() => {
        toast.error('Не удалось сохранить ответ');
      });
    };

    if (question.type === 'TEXT' || question.type === 'CODE' || question.type === 'MANUAL_REVIEW') {
      window.clearTimeout(submitTimersRef.current[question.id]);
      submitTimersRef.current[question.id] = window.setTimeout(sendAnswer, 600);
      return;
    }

    sendAnswer();
  };

  const finalizeParticipation = async (timeout = false) => {
    const participation = useParticipationStore.getState().activeParticipation;
    if (!participation?.id || isFinishingRef.current) {
      toast.error('Активная попытка не найдена');
      return;
    }
    isFinishingRef.current = true;
    try {
      setIsFinishing(true);
      setSecondsLeft(null);
      setDeadlineMs(null);
      Object.values(submitTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      submitTimersRef.current = {};
      setActiveParticipation(null);
      await nextFrame();
      await exitFullscreen();
      const finished = await finishParticipation(participation.id);
      const result = await getParticipationResults(participation.id).catch(() => buildLocalResult(finished, participation.id));
      saveLocalResult(result);
      setResult(result);
      toast.success(
        result.pendingReview
          ? 'Решение передано организаторам на проверку'
          : timeout
            ? 'Время вышло, попытка завершена'
            : 'Олимпиада завершена',
      );
      navigate(`/results/${participation.id}`);
    } catch {
      toast.error('Не удалось завершить олимпиаду');
      setActiveParticipation(participation);
      setDeadlineMs(calculateDeadlineMs(participation.startedAt, durationMinutes));
      isFinishingRef.current = false;
    } finally {
      setIsFinishing(false);
    }
  };

  const buildLocalResult = (finished: any, participationId: string): ParticipationResult => {
    const latestAnswers = useParticipationStore.getState().answers;
    return {
      ...finished,
      id: participationId,
      userEmail: user?.email,
      totalScore: finished.score ?? 0,
      maxPossibleScore,
      answers: questions.map((question) => ({
        questionId: question.id,
        questionText: question.text,
        userAnswer: latestAnswers[question.id] ?? '',
        isCorrect: false,
        pointsEarned: 0,
        maxPoints: question.points,
      })),
    };
  };

  if (isLoading || !currentQuestion) return <Loader />;

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <Card className="h-fit rounded-[28px]">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Идёт попытка</p>
        <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
        <div className="mt-6 space-y-4">
          <Stat label="Осталось" value={secondsLeft === null ? '--:--:--' : formatTimer(secondsLeft)} />
          <Stat label="Длительность" value={formatDurationFromMinutes(durationMinutes)} />
          <Stat label="Вопрос" value={`${currentIndex + 1} / ${questions.length}`} />
          <Badge tone="warning">Прокторинг активен</Badge>
        </div>
        <Button className="mt-6 w-full" variant="danger" disabled={isFinishing} onClick={() => void finalizeParticipation()}>
          Завершить досрочно
        </Button>
      </Card>

      <Card className="rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--text-soft))]">
          Вопрос {currentIndex + 1}
        </p>
        <h2 className="mt-3 text-2xl font-extrabold">{currentQuestion.text}</h2>

        <div className="mt-8 space-y-4">
          {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE') &&
            currentQuestion.options?.map((option) => {
              const currentValue = answers[currentQuestion.id] ?? '';
              const selectedItems = currentValue ? currentValue.split('|') : [];
              const checked =
                currentQuestion.type === 'SINGLE_CHOICE'
                  ? currentValue === option
                  : selectedItems.includes(option);

              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[rgb(var(--border))] p-4 transition hover:border-[rgb(var(--primary))]"
                >
                  <input
                    type={currentQuestion.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                    name={currentQuestion.id}
                    checked={checked}
                    onChange={(event) => {
                      if (currentQuestion.type === 'SINGLE_CHOICE') {
                        handleAnswerChange(currentQuestion, option);
                        return;
                      }

                      const next = event.target.checked
                        ? [...selectedItems, option]
                        : selectedItems.filter((item) => item !== option);
                      handleAnswerChange(currentQuestion, next.join('|'));
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}

          {(currentQuestion.type === 'TEXT' || currentQuestion.type === 'CODE' || currentQuestion.type === 'MANUAL_REVIEW') && (
            <Textarea
              value={answers[currentQuestion.id] ?? ''}
              onChange={(event) => handleAnswerChange(currentQuestion, event.target.value)}
              placeholder={
                currentQuestion.type === 'CODE' || currentQuestion.type === 'MANUAL_REVIEW'
                  ? 'Введите решение или фрагмент кода'
                  : 'Введите текстовый ответ'
              }
              className="min-h-[220px]"
            />
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((value) => value - 1)}
          >
            Назад
          </Button>
          <Button
            onClick={() =>
              setCurrentIndex((value) => (value + 1 < questions.length ? value + 1 : value))
            }
            disabled={currentIndex + 1 >= questions.length}
          >
            Следующий вопрос
          </Button>
        </div>
      </Card>
    </div>
  );
}

function formatTimer(value: number) {
  const safe = Math.max(value, 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => `${part}`.padStart(2, '0')).join(':');
}

function calculateDeadlineMs(startedAt: string, durationMinutes: number) {
  const startedAtMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedAtMs)) {
    return Date.now() + durationMinutes * 60 * 1000;
  }
  return startedAtMs + durationMinutes * 60 * 1000;
}

function calculateSecondsLeft(deadlineMs: number) {
  return Math.max(Math.ceil((deadlineMs - Date.now()) / 1000), 0);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgba(var(--surface-muted),0.75)] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

async function requestFullscreen() {
  if (document.fullscreenElement) return;
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // Браузер может запретить переход без прямого пользовательского действия.
  }
}

async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Fullscreen can already be closing while the attempt is finishing.
  }
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}
