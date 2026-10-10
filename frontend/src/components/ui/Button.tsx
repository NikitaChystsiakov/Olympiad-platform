import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_1px_0_rgb(0_0_0/0.08)] hover:bg-accent-strong dark:text-[#0B1512]',
  secondary: 'border border-line bg-surface text-fg hover:border-soft/40 hover:bg-muted',
  ghost: 'text-fg hover:bg-fg/[0.06]',
  danger: 'bg-risk-high text-white hover:brightness-95 dark:text-[#1A0B0A]',
  ink: 'bg-ink text-white hover:bg-ink/85 dark:bg-fg dark:text-[#0F1211] dark:hover:bg-fg/85',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, type = 'button', disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ className, variant = 'primary', size = 'md', ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: Size;
}

export function IconButton({ label, className, variant = 'ghost', size = 'md', type = 'button', ...props }: IconButtonProps) {
  const square = size === 'sm' ? 'w-8 px-0' : size === 'lg' ? 'w-12 px-0' : 'w-10 px-0';
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={buttonClasses(variant, size, cn(square, className))}
      {...props}
    />
  );
}
