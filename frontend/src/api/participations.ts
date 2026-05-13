import { http } from './http';
import type { AnswerDetail, ManualReviewItem, OlympiadParticipant, Participation, ParticipationResult } from '@/types';

interface SubmitAnswerPayload {
  participationId: string;
  questionId: string;
  answer: string;
}

export async function startParticipation(olympiadId: string) {
  const { data } = await http.post<Participation>(`/participations/start/${olympiadId}`);
  return data;
}

export async function submitAnswer(payload: SubmitAnswerPayload) {
  await http.post('/participations/submit', payload);
}

export async function finishParticipation(participationId: string) {
  const { data } = await http.post<Participation>(`/participations/finish/${participationId}`);
  return data;
}

export async function getParticipationResults(participationId: string) {
  const { data } = await http.get<Participation & {
    participationId?: string;
    userEmail?: string;
    totalScore?: number;
    maxPossibleScore?: number;
    place?: number;
    pendingReview?: boolean;
    answers?: AnswerDetail[];
  }>(
    `/participations/${participationId}/results`,
  );
  return {
    ...data,
    id: data.participationId ?? data.id ?? participationId,
    userEmail: data.userEmail,
    totalScore: data.totalScore ?? data.score ?? 0,
    maxPossibleScore: data.maxPossibleScore ?? 0,
    place: data.place,
    pendingReview: data.pendingReview,
    answers: data.answers ?? ([] as AnswerDetail[]),
  } satisfies ParticipationResult;
}

export async function getOlympiadParticipants(olympiadId: string) {
  const { data } = await http.get<OlympiadParticipant[]>(`/participations/olympiads/${olympiadId}/participants`);
  return data;
}

export async function getManualReviewQueue(olympiadId: string) {
  const { data } = await http.get<ManualReviewItem[]>(`/participations/olympiads/${olympiadId}/manual-review`);
  return data;
}

export async function reviewAnswer(answerId: string, payload: { pointsEarned: number; reviewComment?: string }) {
  const { data } = await http.post(`/participations/answers/${answerId}/review`, payload);
  return data;
}
