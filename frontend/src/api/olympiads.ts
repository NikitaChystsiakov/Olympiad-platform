import { http } from './http';
import type {
  ApiMessage,
  Olympiad,
  OlympiadStatus,
  PageResponse,
  Question,
  QuestionPayload,
} from '@/types';

interface OlympiadPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface RawQuestion {
  id: string;
  text: string;
  type: string;
  options?: string;
  correctAnswer?: string;
  points: number;
}

export async function getOlympiads(params: {
  page: number;
  size: number;
  status?: OlympiadStatus | '';
  search?: string;
}) {
  const { data } = await http.get<PageResponse<Olympiad>>('/olympiads', { params });
  return data;
}

export async function getOlympiadById(id: string) {
  const { data } = await http.get<Olympiad>(`/olympiads/${id}`);
  return data;
}

export async function createOlympiad(payload: OlympiadPayload) {
  const { data } = await http.post<Olympiad>('/olympiads', payload);
  return data;
}

export async function updateOlympiad(id: string, payload: OlympiadPayload) {
  const { data } = await http.put<Olympiad>(`/olympiads/${id}`, payload);
  return data;
}

export async function deleteOlympiad(id: string) {
  await http.delete(`/olympiads/${id}`);
}

export async function publishOlympiad(id: string) {
  const { data } = await http.post<Olympiad>(`/olympiads/${id}/publish`);
  return data;
}

export async function getQuestions(olympiadId: string) {
  const { data } = await http.get<RawQuestion[]>(`/olympiads/${olympiadId}/questions`);
  return data.map(mapQuestion);
}

export async function addQuestion(olympiadId: string, payload: QuestionPayload) {
  const { data } = await http.post<RawQuestion>(`/olympiads/${olympiadId}/questions`, payload);
  return mapQuestion(data);
}

export async function updateQuestion(olympiadId: string, questionId: string, payload: QuestionPayload) {
  const { data } = await http.put<RawQuestion>(
    `/olympiads/${olympiadId}/questions/${questionId}`,
    payload,
  );
  return mapQuestion(data);
}

export async function deleteQuestion(olympiadId: string, questionId: string) {
  const { data } = await http.delete<ApiMessage>(`/olympiads/${olympiadId}/questions/${questionId}`);
  return data;
}

function mapQuestion(raw: RawQuestion): Question {
  let options: string[] | undefined;
  if (raw.options) {
    try {
      const parsed = JSON.parse(raw.options);
      options = Array.isArray(parsed) ? parsed.map(String) : undefined;
    } catch {
      options = raw.options.split(',').map((entry) => entry.trim());
    }
  }

  return {
    id: raw.id,
    text: raw.text,
    type: raw.type as Question['type'],
    options,
    points: raw.points,
  };
}
