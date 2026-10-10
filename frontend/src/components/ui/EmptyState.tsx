import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function EmptyState({ title, text, action, className }: { title: string; text?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-2 rounded-card border border-dashed border-line px-6 py-10', className)}>
      <p className="font-serif text-xl font-semibold">{title}</p>
      {text && <p className="max-w-[60ch] text-soft">{text}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
