import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

/** The mark: a lens ring (camera) that also reads as an "O" for Olympus. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('h-8 w-8 shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-ink dark:fill-[#232A27]" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#F6DD5A" strokeWidth="3" />
      <circle cx="16" cy="16" r="3" fill="#3DBE8F" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 rounded-control font-semibold tracking-[-0.01em]', className)}>
      <LogoMark />
      <span className="text-[16px]">Olympus Proctor</span>
    </Link>
  );
}
