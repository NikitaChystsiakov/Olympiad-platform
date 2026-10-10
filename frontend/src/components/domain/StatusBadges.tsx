import { useT } from '@/i18n';
import type { AttemptStatus, Olympiad, RiskLevel } from '@/types';
import { olympiadPhase, type OlympiadPhase } from '@/utils/olympiad';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

const phaseTone: Record<OlympiadPhase, BadgeTone> = {
  draft: 'neutral',
  upcoming: 'accent',
  open: 'marker',
  closed: 'neutral',
  finished: 'ink',
  cancelled: 'neutral',
};

const phaseKey: Record<OlympiadPhase, string> = {
  draft: 'status.DRAFT',
  upcoming: 'status.upcoming',
  open: 'status.open',
  closed: 'status.closed',
  finished: 'status.FINISHED',
  cancelled: 'status.CANCELLED',
};

export function OlympiadStatusBadge({ olympiad }: { olympiad: Pick<Olympiad, 'status' | 'startTime' | 'endTime'> }) {
  const t = useT();
  const phase = olympiadPhase(olympiad);
  return (
    <Badge tone={phaseTone[phase]}>
      {phase === 'open' && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" aria-hidden />}
      {t(phaseKey[phase])}
    </Badge>
  );
}

const attemptTone: Record<AttemptStatus, BadgeTone> = {
  ACTIVE: 'marker',
  PENDING_REVIEW: 'mid',
  FINISHED: 'low',
  PAUSED: 'neutral',
  DISQUALIFIED: 'high',
};

export function AttemptStatusBadge({ status }: { status: AttemptStatus }) {
  const t = useT();
  return <Badge tone={attemptTone[status]}>{t(`attemptStatus.${status}`)}</Badge>;
}

const riskField: Record<RiskLevel, string> = {
  HIGH: 'bg-risk-high',
  MEDIUM: 'bg-risk-mid',
  LOW: 'bg-risk-low',
};

/** Risk is drawn as a solid saturated field, not a pastel pill: it is the signal the report exists for. */
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-[76px] items-center justify-center rounded-[7px] px-2.5 text-xs font-bold text-white dark:text-[#0F1211]',
        riskField[level],
        className,
      )}
    >
      {t(`proctoring.riskLevel.${level}`)}
    </span>
  );
}
