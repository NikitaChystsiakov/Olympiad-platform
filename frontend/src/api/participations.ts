import { http } from './http';
import type { Attempt, ManualReviewItem, OlympiadParticipant, ParticipationResult, SavedAnswer } from '@/types';

interface SubmitAnswerPayload {
  participationId: string;
  questionId: string;
  answer: string;
}

export async function startParticipation(olympiadId: string) {
  const { data } = await http.post<Attempt>(`/participations/start/${olympiadId}`);
  return data;
}

export async function submitAnswer(payload: SubmitAnswerPayload) {
  await http.post('/participations/submit', payload);
}

export async function finishParticipation(participationId: string) {
  const { data } = await http.post<Attempt>(`/participations/finish/${participationId}`);
  return data;
}

export async function getMyAttempts() {
  const { data } = await http.get<Attempt[]>('/participations/my');
  return data;
}

export async function getSavedAnswers(participationId: string) {
  const { data } = await http.get<SavedAnswer[]>(`/participations/${participationId}/answers`);
  return data;
}

export async function getParticipationResults(participationId: string) {
  const { data } = await http.get<ParticipationResult>(`/participations/${participationId}/results`);
  return data;
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
  await http.post(`/participations/answers/${answerId}/review`, payload);
}
