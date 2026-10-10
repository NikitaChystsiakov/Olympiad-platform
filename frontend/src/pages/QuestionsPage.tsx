import { ArrowLeft, Check, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { addQuestion, deleteQuestion, getOlympiadById, getQuestions, publishOlympiad, updateQuestion } from '@/api/olympiads';
import { useT } from '@/i18n';
import type { Olympiad, Question, QuestionPayload, QuestionType } from '@/types';
import { cn } from '@/utils/cn';
import { OlympiadStatusBadge } from '@/components/domain/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';

const TYPES: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'CODE', 'MANUAL_REVIEW'];

interface Draft {
  type: QuestionType;
  text: string;
  options: string[];
  correct: number[];
  correctText: string;
  points: string;
}

const emptyDraft = (type: QuestionType = 'SINGLE_CHOICE'): Draft => ({
  type,
  text: '',
  options: ['', ''],
  correct: [],
  correctText: '',
  points: '5',
});

function draftFrom(question: Question): Draft {
  const options = question.options?.length ? [...question.options] : ['', ''];
  const answers = (question.correctAnswer ?? '').split(/[,|]/).map((item) => item.trim());
  return {
    type: question.type,
    text: question.text,
    options,
    correct: options.map((option, index) => (answers.includes(option.trim()) ? index : -1)).filter((index) => index >= 0),
    correctText: question.type === 'TEXT' ? question.correctAnswer ?? '' : '',
    points: String(question.points),
  };
}

const isChoice = (type: QuestionType) => type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE';
const isManual = (type: QuestionType) => type === 'CODE' || type === 'MANUAL_REVIEW';

export function QuestionsPage() {
  const t = useT();
  const { id: olympiadId = '' } = useParams();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [errors, setErrors] = useState<Partial<Record<'text' | 'options' | 'correct' | 'points', string>>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toDelete, setToDelete] = useState<{ question: Question; n: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const [loaded, list] = await Promise.all([getOlympiadById(olympiadId), getQuestions(olympiadId)]);
      setOlympiad(loaded);
      setQuestions(list);
    } catch (error) {
      toast.error(errorMessage(error, 'errors.load'));
    } finally {
      setLoading(false);
    }
  }, [olympiadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const editable = olympiad?.status === 'DRAFT' || olympiad?.status === 'PUBLISHED';
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  const resetEditor = (type: QuestionType = draft.type) => {
    setEditingId(null);
    setDraft(emptyDraft(type));
    setErrors({});
  };

  const validate = (): QuestionPayload | null => {
    const next: typeof errors = {};
    const text = draft.text.trim();
    const points = Number(draft.points);
    const options = draft.options.map((option) => option.trim()).filter(Boolean);
    if (text.length < 5) next.text = t('questions.errText');
    if (!Number.isInteger(points) || points < 1 || points > 1000) next.points = t('questions.errPoints');
    let correctAnswer: string | undefined;
    if (isChoice(draft.type)) {
      if (options.length < 2) next.options = t('questions.errOptions');
      const marked = draft.correct.map((index) => draft.options[index]?.trim()).filter(Boolean);
      if (marked.length === 0) next.correct = t('questions.errCorrect');
      correctAnswer = draft.type === 'SINGLE_CHOICE' ? marked[0] : marked.join(',');
    } else if (draft.type === 'TEXT') {
      if (!draft.correctText.trim()) next.correct = t('questions.errCorrectText');
      correctAnswer = draft.correctText.trim();
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      type: draft.type,
      text,
      points,
      options: isChoice(draft.type) ? JSON.stringify(options) : undefined,
      correctAnswer,
    };
  };

  const save = async () => {
    const payload = validate();
    if (!payload) return;
    try {
      setSaving(true);
      if (editingId) {
        await updateQuestion(olympiadId, editingId, payload);
        toast.success(t('questions.saved'));
      } else {
        await addQuestion(olympiadId, payload);
        toast.success(t('questions.added'));
      }
      resetEditor(draft.type);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, 'errors.save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteQuestion(olympiadId, toDelete.question.id);
      toast.success(t('questions.deleted'));
      if (editingId === toDelete.question.id) resetEditor();
      setToDelete(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const publish = async () => {
    try {
      setPublishing(true);
      await publishOlympiad(olympiadId);
      toast.success(t('dashboard.published'));
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const editingIndex = questions.findIndex((question) => question.id === editingId);
  const choiceSingle = draft.type === 'SINGLE_CHOICE';

  return (
    <>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-soft hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {t('nav.olympiads')}
      </Link>
      <PageHeader
        meta={olympiad && <OlympiadStatusBadge olympiad={olympiad} />}
        title={olympiad?.title ?? t('questions.title')}
        lead={
          <>
            {t('questions.total', {
              questions: t('common.questions', { count: questions.length }),
              points: t('common.points', { count: totalPoints }),
            })}
            {' · '}
            {editable ? t('questions.lead') : t('questions.readOnly')}
          </>
        }
        actions={
          olympiad?.status === 'DRAFT' && (
            <Button onClick={() => void publish()} loading={publishing} disabled={questions.length === 0}>
              <Upload className="h-4 w-4" />
              {t('questions.publish')}
            </Button>
          )
        }
      />

      <div className={cn('grid gap-6', editable && 'lg:grid-cols-[minmax(0,1fr)_400px]')}>
        <section aria-label={t('questions.title')}>
          {questions.length === 0 ? (
            <EmptyState title={t('questions.title')} text={t('questions.empty')} />
          ) : (
            <ol className="space-y-3">
              {questions.map((question, index) => (
                <li
                  key={question.id}
                  className={cn(
                    'rounded-card border bg-surface p-5 transition-colors',
                    editingId === question.id ? 'border-accent ring-2 ring-accent/15' : 'border-line',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-serif text-sm font-semibold text-white dark:bg-fg dark:text-[#0F1211]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{question.text}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone="accent">{t(`questionType.${question.type}`)}</Badge>
                        <Badge>{t('common.points', { count: question.points })}</Badge>
                      </div>
                      {question.options && question.options.length > 0 && (
                        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                          {question.options.map((option) => {
                            const correct = (question.correctAnswer ?? '').split(/[,|]/).map((item) => item.trim()).includes(option.trim());
                            return (
                              <li key={option} className={cn('flex items-center gap-2 text-sm', correct ? 'font-semibold text-risk-low' : 'text-soft')}>
                                {correct ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
                                {option}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {question.type === 'TEXT' && question.correctAnswer && (
                        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-risk-low">
                          <Check className="h-3.5 w-3.5" />
                          {question.correctAnswer}
                        </p>
                      )}
                    </div>
                    {editable && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(question.id);
                            setDraft(draftFrom(question));
                            setErrors({});
                          }}
                          aria-label={t('common.edit')}
                          className="grid h-9 w-9 place-items-center rounded-control text-soft hover:bg-fg/[0.06] hover:text-fg"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete({ question, n: index + 1 })}
                          aria-label={t('common.delete')}
                          className="grid h-9 w-9 place-items-center rounded-control text-soft hover:bg-risk-high-bg hover:text-risk-high"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {editable && (
          <section className="space-y-4 self-start rounded-card border border-line bg-surface p-5 shadow-lift lg:sticky lg:top-8" aria-label={t('questions.add')}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold">
                {editingId ? t('questions.editing', { n: editingIndex + 1 }) : t('questions.newQuestion')}
              </h2>
              {editingId && (
                <button type="button" onClick={() => resetEditor()} className="inline-flex items-center gap-1 text-sm font-semibold text-soft hover:text-fg">
                  <X className="h-4 w-4" />
                  {t('common.cancel')}
                </button>
              )}
            </div>

            <Field label={t('questions.type')} htmlFor="q-type">
              <Select
                id="q-type"
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as QuestionType, correct: [] }))}
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`questionType.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('questions.text')} htmlFor="q-text" error={errors.text}>
              <Textarea
                id="q-text"
                rows={4}
                value={draft.text}
                placeholder={t('questions.textPlaceholder')}
                aria-invalid={Boolean(errors.text)}
                onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))}
              />
            </Field>

            {isChoice(draft.type) && (
              <fieldset className="space-y-2">
                <legend className="text-[13px] font-semibold">
                  {t('questions.options')} <span className="font-normal text-soft">· {choiceSingle ? t('questions.markCorrectSingle') : t('questions.markCorrect')}</span>
                </legend>
                {draft.options.map((option, index) => {
                  const marked = draft.correct.includes(index);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        role={choiceSingle ? 'radio' : 'checkbox'}
                        aria-checked={marked}
                        aria-label={t('questions.correct')}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            correct: choiceSingle
                              ? [index]
                              : marked
                                ? current.correct.filter((item) => item !== index)
                                : [...current.correct, index],
                          }))
                        }
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center border transition-colors',
                          choiceSingle ? 'rounded-full' : 'rounded-[10px]',
                          marked ? 'border-accent bg-accent text-white dark:text-[#0B1512]' : 'border-line bg-muted text-transparent hover:text-soft',
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <Input
                        value={option}
                        placeholder={t('questions.optionPlaceholder', { n: index + 1 })}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            options: current.options.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                          }))
                        }
                      />
                      {draft.options.length > 2 && (
                        <button
                          type="button"
                          aria-label={t('common.delete')}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              options: current.options.filter((_, itemIndex) => itemIndex !== index),
                              correct: current.correct.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item)),
                            }))
                          }
                          className="grid h-10 w-9 shrink-0 place-items-center rounded-control text-soft hover:text-risk-high"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {draft.options.length < 8 && (
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, options: [...current.options, ''] }))}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    {t('questions.addOption')}
                  </button>
                )}
                {(errors.options || errors.correct) && (
                  <p role="alert" className="text-[13px] font-medium text-risk-high">
                    {errors.options ?? errors.correct}
                  </p>
                )}
              </fieldset>
            )}

            {draft.type === 'TEXT' && (
              <Field label={t('questions.correct')} htmlFor="q-correct" hint={t('questions.correctPlaceholder')} error={errors.correct}>
                <Input
                  id="q-correct"
                  value={draft.correctText}
                  aria-invalid={Boolean(errors.correct)}
                  onChange={(event) => setDraft((current) => ({ ...current, correctText: event.target.value }))}
                />
              </Field>
            )}

            {isManual(draft.type) && <p className="rounded-control bg-muted px-3 py-2.5 text-sm text-soft">{t('questions.manualNote')}</p>}

            <Field label={t('questions.points')} htmlFor="q-points" error={errors.points} className="max-w-[160px]">
              <Input
                id="q-points"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                value={draft.points}
                aria-invalid={Boolean(errors.points)}
                onChange={(event) => setDraft((current) => ({ ...current, points: event.target.value }))}
              />
            </Field>

            <Button className="w-full" size="lg" onClick={() => void save()} loading={saving}>
              {editingId ? t('questions.submitSave') : t('questions.submitAdd')}
            </Button>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? t('questions.deleteConfirm', { n: toDelete.n }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={() => void remove()}
        onCancel={() => setToDelete(null)}
      >
        {toDelete?.question.text}
      </ConfirmDialog>
    </>
  );
}
