import { cn } from '@/utils/cn';

/** Score drawn at confident scale: a thick field, not a hairline. */
export function ScoreBar({ value, max, className, tone = 'ink' }: { value: number; max: number; className?: string; tone?: 'ink' | 'accent' }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-fg/[0.08]', className)} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={cn('h-full rounded-full', tone === 'ink' ? 'bg-ink dark:bg-fg' : 'bg-accent')} style={{ width: `${percent}%` }} />
    </div>
  );
}
