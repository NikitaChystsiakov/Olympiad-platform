import { format, formatDistanceToNowStrict } from 'date-fns';
import { enGB, ru } from 'date-fns/locale';
import { translate, useLocaleStore, type Locale } from '@/i18n';

const dateLocales = { ru, en: enGB };

function currentLocale(): Locale {
  return useLocaleStore.getState().locale;
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(value?: string | null, locale = currentLocale()) {
  if (!value) return '—';
  return format(toDate(value), translate(locale, 'time.dateTime'), { locale: dateLocales[locale] });
}

export function formatDate(value?: string | null, locale = currentLocale()) {
  if (!value) return '—';
  return format(toDate(value), translate(locale, 'time.date'), { locale: dateLocales[locale] });
}

/** Day and time; the year is added only when it differs from the current one. */
export function formatShort(value?: string | null, locale = currentLocale()) {
  if (!value) return '—';
  const date = toDate(value);
  const key = date.getFullYear() === new Date().getFullYear() ? 'time.short' : 'time.dateTime';
  return format(date, translate(locale, key), { locale: dateLocales[locale] });
}

export function formatTime(value?: string | null) {
  if (!value) return '—';
  return format(toDate(value), 'HH:mm:ss');
}

export function formatRelative(value?: string | null, locale = currentLocale()) {
  if (!value) return '—';
  return formatDistanceToNowStrict(toDate(value), { locale: dateLocales[locale], addSuffix: true });
}

export function formatDuration(minutes: number, locale = currentLocale()) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = translate(locale, 'common.hours');
  const m = translate(locale, 'common.minutes');
  if (hours === 0) return `${rest} ${m}`;
  if (rest === 0) return `${hours} ${h}`;
  return `${hours} ${h} ${rest} ${m}`;
}

export function formatTimer(totalSeconds: number) {
  const safe = Math.max(totalSeconds, 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => `${part}`.padStart(2, '0')).join(':');
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** <input type="datetime-local"> works in local time without a zone. */
export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => `${part}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

/** Answers are stored as "a|b" (multiple choice), JSON arrays or plain text. */
export function formatAnswer(value?: string | null) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // Plain text answer.
  }
  return value.split(/\s*[|,]\s*/).join(', ');
}
