import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

const toneMap = {
  neutral: 'bg-[rgba(var(--surface-muted),0.8)] text-[rgb(var(--text))]',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', toneMap[tone])}>
      {children}
    </span>
  );
}
