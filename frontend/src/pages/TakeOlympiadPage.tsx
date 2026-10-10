import { ArrowLeft, ArrowRight, Camera, CameraOff, ClipboardPaste, Clock, Maximize, PanelsTopLeft, Save, ScanFace, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { getOlympiadById, getQuestions } from '@/api/olympiads';
import { finishParticipation, getMyAttempts, getSavedAnswers, startParticipation, submitAnswer } from '@/api/participations';
import { useCameraProctoring, type CameraState, type FaceState } from '@/hooks/useCameraProctoring';
import { enterFullscreen, exitFullscreen, useBrowserProctoring } from '@/hooks/useProctoring';
import { useT } from '@/i18n';
import type { Attempt, Olympiad, Question } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatDuration, formatTime, formatTimer } from '@/utils/format';
import { CodeEditor } from '@/components/domain/CodeEditor';
import { FileUploader } from '@/components/domain/FileUploader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/ui/Field';
import { LogoMark } from '@/components/ui/Logo';
import { Skeleton } from '@/components/ui/Skeleton';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
const TEXT_DEBOUNCE_MS = 600;
const FINAL_MINUTES = 5 * 60;

/** The attempt always renders in the dark "exam mode" world. */
export function TakeOlympiadPage() {
  const { id: olympiadId = '' } = useParams();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [existing, setExisting] = useState<Attempt | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getOlympiadById(olympiadId), getMyAttempts()])
      .then(([loaded, attempts]) => {
        if (cancelled) return;
        setOlympiad(loaded);
        setExisting(attempts.find((item) => item.olympiadId === olympiadId && item.status === 'ACTIVE') ?? null);
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'errors.load'));
        navigate('/dashboard', { replace: true });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [navigate, olympiadId]);

  const begin = async () => {
    // Fullscreen needs the click's user gesture, so it goes before any await.
    void enterFullscreen();
    try {
      setStarting(true);
      const started = await startParticipation(olympiadId);
      const [list, saved] = await Promise.all([getQuestions(olympiadId), getSavedAnswers(started.id)]);
      setQuestions(list);
      setInitialAnswers(Object.fromEntries(saved.map((item) => [item.questionId, item.answer ?? ''])));
      setAttempt(started);
    } catch (error) {
      void exitFullscreen();
      toast.error(errorMessage(error, 'attempt.startFailed'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-canvas text-fg [color-scheme:dark]">
      {attempt && olympiad ? (
        <ExamRoom olympiad={olympiad} attempt={attempt} questions={questions} initialAnswers={initialAnswers} />
      ) : (
        <Briefing olympiad={olympiad} existing={existing} loading={loading} starting={starting} onStart={() => void begin()} t={t} />
      )}
    </div>
  );
}

function Briefing({
  olympiad,
  existing,
  loading,
  starting,
  onStart,
  t,
}: {
  olympiad: Olympiad | null;
  existing: Attempt | null;
  loading: boolean;
  starting: boolean;
  onStart: () => void;
  t: ReturnType<typeof useT>;
}) {
  const rules: Array<{ icon: typeof Camera; key: string }> = [
    { icon: Camera, key: 'attempt.ruleCamera' },
    { icon: Maximize, key: 'attempt.ruleFullscreen' },
    { icon: ClipboardPaste, key: 'attempt.ruleClipboard' },
    { icon: Save, key: 'attempt.ruleSave' },
    { icon: Clock, key: 'attempt.ruleTimer' },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col px-4 py-8 sm:py-14">
      <Link to="/dashboard" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-soft hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {t('attempt.leave')}
      </Link>

      {loading || !olympiad ? (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : (
        <div className="mt-8 animate-rise">
          <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{olympiad.title}</h1>
          <p className="mt-3 max-w-[64ch] text-soft">{olympiad.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
            {[
              { label: t('attempt.duration'), value: formatDuration(olympiad.durationMinutes) },
              { label: t('attempt.questions'), value: String(olympiad.questionCount) },
              { label: t('attempt.maxScore'), value: t('common.points', { count: olympiad.totalPoints }) },
              { label: t('attempt.window'), value: formatDateTime(olympiad.endTime) },
            ].map((item) => (
              <div key={item.label} className="bg-surface px-4 py-4">
                <dt className="label">{item.label}</dt>
                <dd className="mt-1 font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8">
            <h2 className="font-serif text-xl font-semibold">{t('attempt.rulesTitle')}</h2>
            <ul className="mt-4 space-y-3">
              {rules.map(({ icon: Icon, key }) => (
                <li key={key} className="flex gap-3">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-marker" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <Button size="lg" onClick={onStart} loading={starting} className="min-w-[200px]">
              {starting ? t('attempt.starting') : existing ? t('attempt.resume') : t('attempt.start')}
            </Button>
            {existing && (
              <span className="text-sm text-soft">
                {t('attempt.left')}: <span className="font-mono">{formatTimer(Math.ceil((new Date(existing.deadline).getTime() - Date.now()) / 1000))}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

interface ExamRoomProps {
  olympiad: Olympiad;
  attempt: Attempt;
  questions: Question[];
  initialAnswers: Record<string, string>;
}

function ExamRoom({ olympiad, attempt, questions, initialAnswers }: ExamRoomProps) {
  const t = useT();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [index, setIndex] = useState(() => {
    const firstEmpty = questions.findIndex((question) => !initialAnswers[question.id]?.trim());
    return firstEmpty === -1 ? 0 : firstEmpty;
  });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const deadline = useMemo(() => new Date(attempt.deadline).getTime(), [attempt.deadline]);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((deadline - Date.now()) / 1000));

  const pending = useRef<Map<string, { timer: number; answer: string }>>(new Map());
  const finishingRef = useRef(false);
  const proctoringOn = !finishing;
  const { tabSwitches, isFullscreen } = useBrowserProctoring(olympiad.id, proctoringOn);
  const { videoRef, cameraState, faceState } = useCameraProctoring(olympiad.id, proctoringOn);

  const send = useCallback(
    async (questionId: string, answer: string, retry = true): Promise<void> => {
      setSaveState('saving');
      try {
        await submitAnswer({ participationId: attempt.id, questionId, answer });
        setSaveState('saved');
        setSavedAt(new Date().toISOString());
      } catch {
        setSaveState('error');
        if (retry && !finishingRef.current) {
          window.setTimeout(() => void send(questionId, answer, false), 2000);
        }
      }
    },
    [attempt.id],
  );

  const flushPending = useCallback(async () => {
    const entries = [...pending.current.entries()];
    pending.current.clear();
    entries.forEach(([, item]) => window.clearTimeout(item.timer));
    await Promise.all(entries.map(([questionId, item]) => send(questionId, item.answer, false)));
  }, [send]);

  const updateAnswer = (question: Question, value: string, debounce: boolean) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    const previous = pending.current.get(question.id);
    if (previous) window.clearTimeout(previous.timer);
    if (!debounce) {
      pending.current.delete(question.id);
      void send(question.id, value);
      return;
    }
    const timer = window.setTimeout(() => {
      pending.current.delete(question.id);
      void send(question.id, value);
    }, TEXT_DEBOUNCE_MS);
    pending.current.set(question.id, { timer, answer: value });
  };

  const finish = useCallback(
    async (timeout: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setFinishing(true);
      try {
        await flushPending();
        const finished = await finishParticipation(attempt.id);
        await exitFullscreen();
        toast.success(timeout ? t('attempt.timeUp') : finished.status === 'PENDING_REVIEW' ? t('attempt.sentToReview') : t('attempt.finished'));
        navigate(`/results/${attempt.id}`, { replace: true });
      } catch (error) {
        // The server closes expired attempts itself; the result page is still the right place.
        if (timeout) {
          await exitFullscreen();
          navigate(`/results/${attempt.id}`, { replace: true });
          return;
        }
        toast.error(errorMessage(error, 'attempt.finishFailed'));
        finishingRef.current = false;
        setFinishing(false);
      }
    },
    [attempt.id, flushPending, navigate, t],
  );

  useEffect(() => {
    const tick = () => {
      const next = Math.ceil((deadline - Date.now()) / 1000);
      setSecondsLeft(next);
      if (next <= 0) void finish(true);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, finish]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current.size > 0) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const question = questions[index];
  const isAnswered = (item: Question) => Boolean(answers[item.id]?.trim());
  const unanswered = questions.filter((item) => !isAnswered(item)).length;
  const finalMinutes = secondsLeft <= FINAL_MINUTES;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <LogoMark className="hidden sm:block" />
          <p className="min-w-0 flex-1 truncate font-semibold">{olympiad.title}</p>
          <SaveIndicator state={saveState} savedAt={savedAt} />
          <div
            role="timer"
            aria-live="off"
            className={cn(
              'flex items-center gap-2 rounded-control px-3 py-1.5 font-mono text-xl font-semibold tabular-nums sm:text-2xl lg:hidden',
              finalMinutes ? 'bg-risk-high text-white' : 'bg-surface text-fg ring-1 ring-line',
            )}
            title={finalMinutes ? t('attempt.lastMinutes') : t('attempt.left')}
          >
            {formatTimer(secondsLeft)}
          </div>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)} disabled={finishing}>
            {t('attempt.finish')}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <nav aria-label={t('attempt.questionsNav')} className="lg:order-1">
          <div className="lg:sticky lg:top-24">
            <p className="label">{t('attempt.questionsNav')}</p>
            <ol className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
              {questions.map((item, itemIndex) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    aria-current={itemIndex === index ? 'step' : undefined}
                    aria-label={t('attempt.question', { n: itemIndex + 1, total: questions.length })}
                    className={cn(
                      'grid h-10 w-full place-items-center rounded-[10px] text-sm font-semibold transition-colors duration-150',
                      itemIndex === index
                        ? 'bg-marker text-[#3A3000]'
                        : isAnswered(item)
                          ? 'bg-accent-soft text-accent hover:brightness-110'
                          : 'bg-surface text-soft ring-1 ring-line hover:text-fg',
                    )}
                  >
                    {itemIndex + 1}
                  </button>
                </li>
              ))}
            </ol>
            <ul className="mt-3 hidden flex-wrap gap-x-4 gap-y-1.5 text-xs text-soft sm:flex lg:mt-4 lg:flex-col">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-accent-soft ring-1 ring-accent/40" />
                {t('attempt.legendAnswered')}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-marker" />
                {t('attempt.legendCurrent')}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-surface ring-1 ring-line" />
                {t('attempt.legendEmpty')}
              </li>
            </ul>
          </div>
        </nav>

        <main className="min-w-0 lg:order-2">
          {question && (
            <article key={question.id} className="animate-rise rounded-card border border-line bg-surface p-5 sm:p-8">
              <h1 className="font-serif text-[22px] font-semibold leading-snug sm:text-[26px]">{question.text}</h1>
              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-soft">
                <span>{t('attempt.question', { n: index + 1, total: questions.length })}</span>
                <span aria-hidden>·</span>
                <span>{t(`questionType.${question.type}`)}</span>
                <span aria-hidden>·</span>
                <span>{t('common.points', { count: question.points })}</span>
              </p>

              <div className="mt-7">
                <AnswerInput
                  question={question}
                  value={answers[question.id] ?? ''}
                  onChange={updateAnswer}
                  participationId={attempt.id}
                />
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
                <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
                  <ArrowLeft className="h-4 w-4" />
                  {t('attempt.prev')}
                </Button>
                {index + 1 < questions.length ? (
                  <Button variant="secondary" onClick={() => setIndex((value) => value + 1)}>
                    {t('attempt.next')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setConfirmOpen(true)} disabled={finishing}>
                    {t('attempt.finish')}
                  </Button>
                )}
              </div>
            </article>
          )}
        </main>

        <aside aria-label={t('attempt.proctoring')} className="lg:order-3">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div
              className={cn(
                'hidden rounded-chip p-5 text-white ring-1 transition-colors duration-300 lg:block',
                finalMinutes ? 'bg-risk-high ring-risk-high' : 'bg-[#0A0C0B] ring-line',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
                {finalMinutes ? t('attempt.lastMinutes') : t('attempt.left')}
              </p>
              <p className="mt-1.5 font-mono text-[52px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatTimer(secondsLeft)}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-chip bg-[#0A0C0B] ring-1 ring-line">
              <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
              {cameraState !== 'on' && (
                <div className="absolute inset-0 grid place-items-center text-center text-sm text-soft">
                  <span className="flex flex-col items-center gap-2">
                    {cameraState === 'off' ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6 animate-pulse-dot" />}
                    {cameraState === 'off' ? t('attempt.cameraOff') : t('attempt.cameraStarting')}
                  </span>
                </div>
              )}
              {cameraState === 'on' && (
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#FF5A4E]" />
                  REC
                </span>
              )}
            </div>
            <ul className="space-y-2 rounded-chip border border-line bg-surface p-3 text-[13px]">
              <FaceStatus cameraState={cameraState} faceState={faceState} />
              <Signal ok={isFullscreen} icon={<Maximize className="h-4 w-4" />}>
                <span className="flex flex-1 items-center justify-between gap-2">
                  {isFullscreen ? t('attempt.fullscreenOn') : t('attempt.fullscreenOff')}
                  {!isFullscreen && (
                    <button type="button" onClick={() => void enterFullscreen()} className="font-semibold text-accent hover:underline">
                      {t('attempt.fullscreenReturn')}
                    </button>
                  )}
                </span>
              </Signal>
              <Signal ok={tabSwitches === 0} icon={<PanelsTopLeft className="h-4 w-4" />}>
                {tabSwitches === 0 ? t('attempt.noTabSwitches') : t('attempt.tabSwitches', { count: tabSwitches })}
              </Signal>
            </ul>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('attempt.finishTitle')}
        confirmLabel={t('attempt.finishConfirm')}
        cancelLabel={t('attempt.keepGoing')}
        loading={finishing}
        onConfirm={() => {
          setConfirmOpen(false);
          void finish(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      >
        {unanswered > 0 ? t('attempt.finishUnanswered', { count: unanswered }) : t('attempt.finishAll')}
      </ConfirmDialog>
    </div>
  );
}

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  const t = useT();
  if (state === 'idle') return null;
  return (
    <span
      aria-live="polite"
      className={cn('hidden items-center gap-1.5 text-[13px] md:inline-flex', state === 'error' ? 'text-risk-high' : 'text-soft')}
    >
      {state === 'error' ? <TriangleAlert className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
      {state === 'saving' ? t('attempt.savingNow') : state === 'error' ? t('attempt.saveFailed') : `${t('attempt.saved')} · ${formatTime(savedAt)}`}
    </span>
  );
}

function Signal({ ok, icon, children }: { ok: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <li className={cn('flex items-center gap-2.5', ok ? 'text-risk-low' : 'text-risk-mid')}>
      {icon}
      <span className="flex flex-1 text-fg">{children}</span>
    </li>
  );
}

function FaceStatus({ cameraState, faceState }: { cameraState: CameraState; faceState: FaceState }) {
  const t = useT();
  if (cameraState === 'off') {
    return (
      <Signal ok={false} icon={<CameraOff className="h-4 w-4" />}>
        {t('attempt.cameraOff')}
      </Signal>
    );
  }
  const label =
    faceState === 'ok'
      ? t('attempt.faceOk')
      : faceState === 'missing'
        ? t('attempt.faceMissing')
        : faceState === 'many'
          ? t('attempt.faceMany')
          : faceState === 'unsupported'
            ? t('attempt.faceUnsupported')
            : t('attempt.cameraStarting');
  return (
    <Signal ok={faceState === 'ok'} icon={<ScanFace className="h-4 w-4" />}>
      {label}
    </Signal>
  );
}

interface AnswerInputProps {
  question: Question;
  value: string;
  participationId: string;
  onChange: (question: Question, value: string, debounce: boolean) => void;
}

function AnswerInput({ question, value, participationId, onChange }: AnswerInputProps) {
  const t = useT();

  if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
    const multiple = question.type === 'MULTIPLE_CHOICE';
    const selected = value ? value.split('|') : [];
    return (
      <div role={multiple ? 'group' : 'radiogroup'} className="space-y-2">
        {(question.options ?? []).map((option, optionIndex) => {
          const checked = multiple ? selected.includes(option) : value === option;
          return (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-chip border px-4 py-3.5 transition-colors duration-150',
                checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-soft/40',
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={question.id}
                checked={checked}
                onChange={(event) => {
                  if (!multiple) {
                    onChange(question, option, false);
                    return;
                  }
                  const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option);
                  onChange(question, next.join('|'), false);
                }}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center text-[13px] font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent',
                  multiple ? 'rounded-[7px]' : 'rounded-full',
                  checked ? 'bg-accent text-[#0B1512]' : 'bg-muted text-soft',
                )}
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="text-[15px]">{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === 'CODE') {
    return (
      <div className="space-y-2">
        <CodeEditor value={value} onChange={(next) => onChange(question, next, true)} />
        <p className="text-[13px] text-soft">{t('attempt.codeNote')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Textarea
        value={value}
        onChange={(event) => onChange(question, event.target.value, true)}
        placeholder={question.type === 'TEXT' ? t('attempt.textPlaceholder') : t('attempt.manualPlaceholder')}
        rows={question.type === 'TEXT' ? 3 : 8}
        aria-label={question.text}
      />
      {question.type === 'MANUAL_REVIEW' && <FileUploader participationId={participationId} questionId={question.id} />}
    </div>
  );
}

