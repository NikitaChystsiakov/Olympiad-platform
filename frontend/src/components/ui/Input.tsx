import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.96)] px-4 text-sm text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgba(var(--primary),0.2)]',
          className,
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';