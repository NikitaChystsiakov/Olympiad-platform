import type { Olympiad } from '@/types';

export type OlympiadPhase = 'draft' | 'upcoming' | 'open' | 'closed' | 'finished' | 'cancelled';

/** What a participant can do right now, derived from status + start window. */
export function olympiadPhase(olympiad: Pick<Olympiad, 'status' | 'startTime' | 'endTime'>, now = Date.now()): OlympiadPhase {
  if (olympiad.status === 'DRAFT') return 'draft';
  if (olympiad.status === 'FINISHED') return 'finished';
  if (olympiad.status === 'CANCELLED') return 'cancelled';
  const start = new Date(olympiad.startTime).getTime();
  const end = new Date(olympiad.endTime).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'open';
}
