import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgba(var(--surface),0.55)] p-8 text-center">
      <FileSearch className="mb-4 h-10 w-10 text-[rgb(var(--text-soft))]" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[rgb(var(--text-soft))]">{description}</p>
    </div>
  );
}
