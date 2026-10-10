import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeTone = 'neutral' | 'accent' | 'marker' | 'ink' | 'high' | 'mid' | 'low';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-fg/[0.07] text-soft',
  accent: 'bg-accent-soft text-accent',
  marker: 'bg-marker text-[#3A3000]',
  ink: 'bg-ink text-white dark:bg-fg/90 dark:text-[#0F1211]',
  high: 'bg-risk-high-bg text-risk-high',
  mid: 'bg-risk-mid-bg text-risk-mid',
  low: 'bg-risk-low-bg text-risk-low',
};

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold leading-5', tones[tone], className)}>
      {children}
    </span>
  );
}
