import type { LocalProctoringEntry, Participation, ParticipationResult } from '@/types';

const PARTICIPATIONS_KEY = 'olympus_local_participations';
const RESULTS_KEY = 'olympus_local_results';
const PROCTORING_KEY = 'olympus_local_proctoring';

export function pushLocalParticipation(item: Participation) {
  const current = readLocalParticipations().filter((entry) => entry.id !== item.id);
  current.unshift(item);
  localStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(current.slice(0, 50)));
}

export function readLocalParticipations() {
  return readLimitedArray<Participation>(PARTICIPATIONS_KEY, 50);
}

export function saveLocalResult(item: ParticipationResult) {
  const current = readLocalResults().filter((entry) => entry.id !== item.id);
  current.unshift(item);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(current.slice(0, 50)));
}

export function readLocalResults() {
  return readLimitedArray<ParticipationResult>(RESULTS_KEY, 50);
}

export function saveLocalProctoringEvent(item: LocalProctoringEntry) {
  const current = readLocalProctoringEvents();
  current.unshift(item);
  localStorage.setItem(PROCTORING_KEY, JSON.stringify(current.slice(0, 300)));
}

export function readLocalProctoringEvents() {
  return readLimitedArray<LocalProctoringEntry>(PROCTORING_KEY, 300);
}

function readLimitedArray<T>(key: string, limit: number): T[] {
  const items = readJson<T[]>(key, []);
  const limited = Array.isArray(items) ? items.slice(0, limit) : [];
  if (limited.length !== items.length) {
    localStorage.setItem(key, JSON.stringify(limited));
  }
  return limited;
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
