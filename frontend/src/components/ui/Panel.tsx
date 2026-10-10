import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/** A white surface on the canvas: the one container of the system. Never nest panels. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' }) {
  return <section className={cn('rounded-card border border-line bg-surface shadow-lift', className)} {...props} />;
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6', className)} {...props} />;
}
