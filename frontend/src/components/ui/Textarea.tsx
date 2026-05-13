import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border border-[rgba(var(--border),0.6)] bg-[rgba(var(--surface),0.85)] px-4 py-3 text-sm backdrop-blur-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary),0.3)] ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
