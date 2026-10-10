import { cn } from '@/utils/cn';

interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface ChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Single-select filter chips (radio semantics). */
export function Chips<T extends string>({ options, value, onChange, label, className }: ChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-chip border px-3.5 text-sm font-semibold transition-colors duration-150',
              active ? 'border-ink bg-ink text-white dark:border-fg dark:bg-fg dark:text-[#0F1211]' : 'border-line bg-surface text-soft hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && <span className={cn('num text-xs', active ? 'opacity-70' : 'text-soft/80')}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
