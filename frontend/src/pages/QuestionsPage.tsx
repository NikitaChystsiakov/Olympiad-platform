import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { addQuestion, deleteQuestion, getOlympiadById, getQuestions, updateQuestion } from '@/api/olympiads';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Question } from '@/types';

const schema = z.object({
  text: z.string().min(5, 'Введите текст вопроса'),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'CODE', 'MANUAL_REVIEW']),
  options: z.string().optional(),
  correctAnswer: z.string().optional(),
  points: z.coerce.number().min(1, 'Минимум 1 балл'),
});

type FormValues = z.infer<typeof schema>;

export function QuestionsPage() {
  const { id: olympiadId } = useParams();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'SINGLE_CHOICE',
      points: 1,
    },
  });

  const currentType = watch('type');

  useEffect(() => {
    if (!olympiadId) return;
    void loadPage(olympiadId);
  }, [olympiadId]);

  const loadPage = async (currentOlympiadId: string) => {
    try {
      setIsLoading(true);
      const [olympiad, list] = await Promise.all([
        getOlympiadById(currentOlympiadId),
        getQuestions(currentOlympiadId),
      ]);
      setTitle(olympiad.title);
      setQuestions(list);
    } catch {
      toast.error('Не удалось загрузить вопросы');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!olympiadId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        options: values.options?.trim() ? values.options : undefined,
        correctAnswer: values.correctAnswer?.trim() ? values.correctAnswer : undefined,
      };

      if (editing) {
        await updateQuestion(olympiadId, editing.id, payload);
        toast.success('Вопрос обновлён');
      } else {
        await addQuestion(olympiadId, payload);
        toast.success('Вопрос добавлен');
      }

      reset({ text: '', type: values.type, options: '', correctAnswer: '', points: 1 });
      setEditing(null);
      await loadPage(olympiadId);
    } catch {
      toast.error('Не удалось сохранить вопрос');
    } finally {
      setIsSubmitting(false);
    }
  });

  const startEdit = (question: Question) => {
    setEditing(question);
    reset({
      text: question.text,
      type: question.type,
      options: question.options ? JSON.stringify(question.options, null, 2) : '',
      correctAnswer: '',
      points: question.points,
    });
  };

  const handleDelete = async (questionId: string) => {
    if (!olympiadId) return;
    try {
      await deleteQuestion(olympiadId, questionId);
      toast.success('Вопрос удалён');
      await loadPage(olympiadId);
    } catch {
      toast.error('Не удалось удалить вопрос');
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card className="h-fit rounded-[28px] p-6">
        <h1 className="text-2xl font-extrabold">Вопросы: {title}</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
          Варианты ответов передавайте JSON-массивом, например `["A","B","C"]`.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold">Тип вопроса</label>
            <Select {...register('type')}>
              <option value="SINGLE_CHOICE">Одиночный выбор</option>
              <option value="MULTIPLE_CHOICE">Множественный выбор</option>
              <option value="TEXT">Текстовый ответ</option>
              <option value="CODE">Код</option>
              <option value="MANUAL_REVIEW">Задача с ручной проверкой</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Текст вопроса</label>
            <Textarea {...register('text')} />
            {errors.text && <p className="mt-2 text-sm text-rose-500">{errors.text.message}</p>}
          </div>

          {(currentType === 'SINGLE_CHOICE' || currentType === 'MULTIPLE_CHOICE') && (
            <div>
              <label className="mb-2 block text-sm font-semibold">Варианты ответов</label>
              <Textarea {...register('options')} placeholder='["Вариант 1", "Вариант 2"]' />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold">Правильный ответ</label>
            <Input
              {...register('correctAnswer')}
              placeholder={
                currentType === 'MULTIPLE_CHOICE' ? 'Например: ["A","C"] или A,C' : 'Введите ответ'
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Баллы</label>
            <Input type="number" {...register('points')} />
            {errors.points && <p className="mt-2 text-sm text-rose-500">{errors.points.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Обновить вопрос' : 'Добавить вопрос'}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  reset({ text: '', type: 'SINGLE_CHOICE', options: '', correctAnswer: '', points: 1 });
                }}
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <EmptyState
            title="Вопросы пока не добавлены"
            description="Создайте первый вопрос, и он сразу появится в списке справа."
          />
        ) : (
          questions.map((question) => (
            <Card key={question.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge tone="info">{question.type}</Badge>
                    <Badge tone="neutral">{question.points} балл.</Badge>
                  </div>
                  <h3 className="text-lg font-bold">{question.text}</h3>
                  {question.options && (
                    <div className="mt-4 space-y-2">
                      {question.type === 'SINGLE_CHOICE' &&
                        question.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 text-sm">
                            <input type="radio" disabled />
                            <span>{option}</span>
                          </label>
                        ))}
                      {question.type === 'MULTIPLE_CHOICE' &&
                        question.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 text-sm">
                            <input type="checkbox" disabled />
                            <span>{option}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" className="w-11 px-0" onClick={() => startEdit(question)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" className="w-11 px-0" onClick={() => void handleDelete(question.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
