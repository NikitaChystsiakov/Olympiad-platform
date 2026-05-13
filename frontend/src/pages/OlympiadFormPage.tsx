import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getPublicHolidays, type Holiday } from '@/api/calendar';
import { createOlympiad, getOlympiadById, updateOlympiad } from '@/api/olympiads';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Textarea } from '@/components/ui/Textarea';

interface OlympiadFormPageProps {
  mode?: 'create' | 'edit';
}

export function OlympiadFormPage({ mode: _mode }: OlympiadFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [holidayApiError, setHolidayApiError] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    durationMinutes: 60,
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    getOlympiadById(id)
      .then((olympiad) => {
        setFormData({
          title: olympiad.title,
          description: olympiad.description,
          startDateTime: olympiad.startTime.slice(0, 16),
          endDateTime: olympiad.endTime.slice(0, 16),
          durationMinutes: olympiad.durationMinutes,
        });
      })
      .catch(() => toast.error('Не удалось загрузить олимпиаду'))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const holidayYears = useMemo(
    () => getYearsBetween(formData.startDateTime, formData.endDateTime),
    [formData.startDateTime, formData.endDateTime],
  );

  useEffect(() => {
    if (holidayYears.length === 0) {
      setHolidays([]);
      setHolidayApiError(false);
      return;
    }

    let isMounted = true;
    setIsLoadingHolidays(true);
    setHolidayApiError(false);

    Promise.all(holidayYears.map((year) => getPublicHolidays(year)))
      .then((items) => {
        if (!isMounted) return;
        setHolidays(items.flat());
      })
      .catch(() => {
        if (!isMounted) return;
        setHolidays([]);
        setHolidayApiError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHolidays(false);
      });

    return () => {
      isMounted = false;
    };
  }, [holidayYears]);

  const holidaysInStartWindow = useMemo(
    () => filterHolidaysInWindow(holidays, formData.startDateTime, formData.endDateTime),
    [formData.endDateTime, formData.startDateTime, holidays],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Введите название олимпиады');
      return;
    }
    if (!formData.startDateTime || !formData.endDateTime) {
      toast.error('Укажите окно времени, когда участник может начать олимпиаду');
      return;
    }
    if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
      toast.error('Окончание окна старта должно быть позже начала');
      return;
    }
    if (formData.durationMinutes < 10) {
      toast.error('Длительность выполнения должна быть не меньше 10 минут');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description,
      startTime: toLocalDateTime(formData.startDateTime),
      endTime: `${toLocalDateTime(formData.endDateTime)}:00`,
      durationMinutes: formData.durationMinutes,
    };

    try {
      setIsSubmitting(true);
      if (isEdit && id) {
        await updateOlympiad(id, payload);
        toast.success('Олимпиада обновлена');
      } else {
        await createOlympiad(payload);
        toast.success('Олимпиада создана как черновик');
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="mx-auto max-w-3xl animate-floatIn">
      <Card className="rounded-[18px] border border-[rgba(var(--border),0.6)] bg-[rgba(var(--surface),0.85)] p-8 shadow-soft backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            {isEdit ? 'Редактирование олимпиады' : 'Создание олимпиады'}
          </h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
            Окно старта задает период, когда студент может начать попытку. Длительность считается отдельно для каждой попытки.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text))]">
              Название олимпиады
            </label>
            <Input
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="Например: Олимпиада по программированию 2026"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text))]">
              Описание
            </label>
            <Textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Темы, правила и требования к участникам"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text))]">
                Начать можно с
              </label>
              <Input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(event) => setFormData({ ...formData, startDateTime: event.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text))]">
                Начать можно до
              </label>
              <Input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(event) => setFormData({ ...formData, endDateTime: event.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text))]">
              Длительность выполнения, минут
            </label>
            <Input
              type="number"
              min="10"
              max="300"
              step="5"
              value={formData.durationMinutes}
              onChange={(event) => setFormData({ ...formData, durationMinutes: Number(event.target.value) })}
            />
          </div>

          {formData.startDateTime && formData.endDateTime && (
            <div className="rounded-xl border border-[rgba(var(--primary),0.2)] bg-[rgba(var(--primary),0.04)] p-4">
              <p className="text-sm font-semibold text-[rgb(var(--primary))]">Параметры попытки</p>
              <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
                Студент может начать с {formatDateTime(formData.startDateTime)} до {formatDateTime(formData.endDateTime)}.
                После старта таймер будет идти {formData.durationMinutes} минут.
              </p>
            </div>
          )}

          {formData.startDateTime && formData.endDateTime && (
            <div className="rounded-xl border border-[rgba(var(--border),0.7)] bg-[rgba(var(--surface-muted),0.55)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">Календарь праздников</p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-soft))]">
                    Проверка окна старта по публичному календарю Nager.Date для Беларуси.
                  </p>
                </div>
                <span className="rounded-full border border-[rgba(var(--border),0.8)] px-3 py-1 text-xs font-semibold text-[rgb(var(--text-soft))]">
                  BY
                </span>
              </div>

              <div className="mt-3 text-sm">
                {isLoadingHolidays && <p className="text-[rgb(var(--text-soft))]">Проверяем даты...</p>}
                {!isLoadingHolidays && holidayApiError && (
                  <p className="text-red-500">Календарь временно недоступен, сохранение олимпиады не заблокировано.</p>
                )}
                {!isLoadingHolidays && !holidayApiError && holidaysInStartWindow.length === 0 && (
                  <p className="text-[rgb(var(--text-soft))]">В выбранном окне государственных праздников не найдено.</p>
                )}
                {!isLoadingHolidays && !holidayApiError && holidaysInStartWindow.length > 0 && (
                  <div className="space-y-2">
                    {holidaysInStartWindow.map((holiday) => (
                      <div
                        key={`${holiday.countryCode}-${holiday.date}-${holiday.name}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[rgba(var(--surface),0.9)] px-3 py-2"
                      >
                        <span className="font-semibold text-[rgb(var(--primary))]">
                          {new Date(`${holiday.date}T00:00:00`).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="text-[rgb(var(--text))]">{holiday.localName || holiday.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')} className="px-6">
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? 'Сохраняем...' : isEdit ? 'Обновить олимпиаду' : 'Сохранить олимпиаду'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getYearsBetween(start: string, end: string) {
  if (!start || !end) return [];

  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  if (Number.isNaN(startYear) || Number.isNaN(endYear)) return [];

  const years = new Set<number>();
  for (let year = startYear; year <= endYear; year += 1) {
    years.add(year);
  }
  return Array.from(years);
}

function filterHolidaysInWindow(holidays: Holiday[], start: string, end: string) {
  if (!start || !end) return [];

  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);
  if (!startDate || !endDate) return [];

  return holidays
    .filter((holiday) => holiday.date >= startDate && holiday.date <= endDate)
    .sort((left, right) => left.date.localeCompare(right.date));
}
