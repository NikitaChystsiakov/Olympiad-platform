import type { ReactNode } from 'react';

export function PageHeader({ title, lead, actions, meta }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        {meta}
        <h1 className="font-serif text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]">{title}</h1>
        {lead && <p className="max-w-[68ch] text-soft">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
