import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl border p-5 shadow-soft transition duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
