import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDateTime(value?: string) {
  if (!value) return '—';
  return format(parseISO(value), 'dd.MM.yyyy HH:mm', { locale: ru });
}

export function formatDurationFromMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  return `${hours} ч ${rest} мин`;
}

export function formatRelative(value?: string) {
  if (!value) return '—';
  return formatDistanceToNowStrict(parseISO(value), { locale: ru, addSuffix: true });
}

export function toDateTimeLocalValue(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => `${part}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function normalizeDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}
