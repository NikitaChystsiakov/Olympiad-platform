import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-[rgb(var(--primary))] text-white shadow-soft hover:bg-[rgb(var(--primary-strong))] focus:ring-[rgb(var(--primary))]',
  secondary:
    'bg-[rgba(var(--surface-muted),0.85)] text-[rgb(var(--text))] hover:bg-[rgba(var(--surface-muted),1)] focus:ring-[rgb(var(--border))]',
  ghost:
    'bg-transparent text-[rgb(var(--text))] hover:bg-[rgba(var(--surface-muted),0.65)] focus:ring-[rgb(var(--border))]',
  danger:
    'bg-[rgb(var(--danger))] text-white hover:opacity-90 focus:ring-[rgb(var(--danger))]',
};

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
