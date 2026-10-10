import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { getPublicHolidays, type Holiday } from '@/api/calendar';
import { errorMessage } from '@/api/http';
import { createOlympiad, getOlympiadById, updateOlympiad } from '@/api/olympiads';
import { useLocale, useT } from '@/i18n';
import { formatDate, formatDateTime, formatDuration, fromDateTimeLocalValue, toDateTimeLocalValue } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';

function defaultWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: toDateTimeLocalValue(start.toISOString()), end: toDateTimeLocalValue(end.toISOString()) };
}

export function OlympiadFormPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          title: z.string().trim().min(5, t('olympiadForm.errTitle')).max(200, t('olympiadForm.errTitle')),
          description: z.string().trim().min(10, t('olympiadForm.errDescription')).max(2000, t('olympiadForm.errDescription')),
          start: z.string().min(1, t('olympiadForm.errRequired')),
          end: z.string().min(1, t('olympiadForm.errRequired')),
          durationMinutes: z.coerce.number().int().min(5, t('olympiadForm.errDuration')).max(480, t('olympiadForm.errDuration')),
        })
        .refine((values) => !values.start || !values.end || new Date(values.end) > new Date(values.start), {
          message: t('olympiadForm.errWindow'),
          path: ['end'],
        }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', durationMinutes: 60, ...defaultWindow() },
  });

  useEffect(() => {
    if (!id) return;
    getOlympiadById(id)
      .then((olympiad) =>
        reset({
          title: olympiad.title,
          description: olympiad.description ?? '',
          start: toDateTimeLocalValue(olympiad.startTime),
          end: toDateTimeLocalValue(olympiad.endTime),
          durationMinutes: olympiad.durationMinutes,
        }),
      )
      .catch((error) => toast.error(errorMessage(error, 'errors.load')))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const [start, end, duration] = watch(['start', 'end', 'durationMinutes']);
  const holidays = useHolidays(start, end);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      description: values.description,
      startTime: fromDateTimeLocalValue(values.start),
      endTime: fromDateTimeLocalValue(values.end),
      durationMinutes: values.durationMinutes,
    };
    try {
      setSubmitting(true);
      if (id) {
        await updateOlympiad(id, payload);
        toast.success(t('olympiadForm.updated'));
        navigate('/dashboard');
      } else {
        const created = await createOlympiad(payload);
        toast.success(t('olympiadForm.created'));
        navigate(`/olympiads/${created.id}/questions`);
      }
    } catch (error) {
      toast.error(errorMessage(error, 'errors.save'));
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) return <PageSkeleton />;

  const validWindow = start && end && new Date(end) > new Date(start);

  return (
    <>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-soft hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {t('nav.olympiads')}
      </Link>
      <PageHeader title={isEdit ? t('olympiadForm.editTitle') : t('olympiadForm.createTitle')} lead={t('olympiadForm.lead')} />

      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
            <h2 className="font-serif text-xl font-semibold">{t('olympiadForm.basics')}</h2>
            <Field label={t('olympiadForm.title')} htmlFor="title" error={errors.title?.message}>
              <Input id="title" placeholder={t('olympiadForm.titlePlaceholder')} aria-invalid={Boolean(errors.title)} {...register('title')} />
            </Field>
            <Field label={t('olympiadForm.description')} htmlFor="description" error={errors.description?.message}>
              <Textarea
                id="description"
                rows={5}
                placeholder={t('olympiadForm.descriptionPlaceholder')}
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
            <h2 className="font-serif text-xl font-semibold">{t('olympiadForm.schedule')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('olympiadForm.startFrom')} htmlFor="start" error={errors.start?.message}>
                <Input id="start" type="datetime-local" aria-invalid={Boolean(errors.start)} {...register('start')} />
              </Field>
              <Field label={t('olympiadForm.startUntil')} htmlFor="end" error={errors.end?.message}>
                <Input id="end" type="datetime-local" aria-invalid={Boolean(errors.end)} {...register('end')} />
              </Field>
            </div>
            <Field label={t('olympiadForm.duration')} htmlFor="duration" hint={t('olympiadForm.durationHint')} error={errors.durationMinutes?.message} className="sm:max-w-[240px]">
              <Input id="duration" type="number" inputMode="numeric" min={5} max={480} step={5} aria-invalid={Boolean(errors.durationMinutes)} {...register('durationMinutes')} />
            </Field>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" loading={submitting}>
              {isEdit ? t('olympiadForm.submitEdit') : t('olympiadForm.submitCreate')}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <section className="rounded-card bg-ink p-5 text-white dark:bg-[#0A0C0B]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">{t('olympiadForm.summary')}</h2>
            <p className="mt-3 leading-relaxed">
              {validWindow
                ? t('olympiadForm.summaryText', {
                    from: formatDateTime(new Date(start).toISOString(), locale),
                    until: formatDateTime(new Date(end).toISOString(), locale),
                    duration: formatDuration(Number(duration) || 0, locale),
                  })
                : t('olympiadForm.summaryEmpty')}
            </p>
          </section>

          <section className="rounded-card border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-accent" />
              {t('olympiadForm.holidays')}
            </h2>
            <div className="mt-2 text-sm">
              {holidays.state === 'loading' && <p className="text-soft">{t('olympiadForm.holidaysLoading')}</p>}
              {holidays.state === 'error' && <p className="text-risk-mid">{t('olympiadForm.holidaysError')}</p>}
              {holidays.state === 'ready' && holidays.items.length === 0 && <p className="text-soft">{t('olympiadForm.holidaysNone')}</p>}
              {holidays.state === 'ready' && holidays.items.length > 0 && (
                <ul className="space-y-1.5">
                  {holidays.items.map((holiday) => (
                    <li key={`${holiday.date}-${holiday.name}`} className="flex gap-3 rounded-control bg-risk-mid-bg px-3 py-2">
                      <span className="font-semibold text-risk-mid">{formatDate(`${holiday.date}T00:00:00`, locale)}</span>
                      <span>{locale === 'ru' ? holiday.localName : holiday.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>
      </form>
    </>
  );
}

function useHolidays(start: string, end: string) {
  const [state, setState] = useState<{ state: 'idle' | 'loading' | 'ready' | 'error'; items: Holiday[] }>({ state: 'idle', items: [] });
  const startDate = start?.slice(0, 10);
  const endDate = end?.slice(0, 10);

  useEffect(() => {
    if (!startDate || !endDate || endDate < startDate) {
      setState({ state: 'idle', items: [] });
      return;
    }
    const years: number[] = [];
    for (let year = Number(startDate.slice(0, 4)); year <= Number(endDate.slice(0, 4)); year += 1) years.push(year);
    let cancelled = false;
    setState((current) => ({ ...current, state: 'loading' }));
    const timer = window.setTimeout(() => {
      Promise.all(years.slice(0, 3).map((year) => getPublicHolidays(year)))
        .then((lists) => {
          if (cancelled) return;
          const items = lists
            .flat()
            .filter((holiday) => holiday.date >= startDate && holiday.date <= endDate)
            .sort((a, b) => a.date.localeCompare(b.date));
          setState({ state: 'ready', items });
        })
        .catch(() => !cancelled && setState({ state: 'error', items: [] }));
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [startDate, endDate]);

  return state;
}
