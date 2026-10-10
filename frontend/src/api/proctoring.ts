import { http } from './http';
import type { ProctoringEventPayload, ProctoringReport } from '@/types';

export async function sendProctoringEvent(payload: ProctoringEventPayload) {
  await http.post('/proctoring/event', payload);
}

export async function getProctoringReport(olympiadId: string) {
  const { data } = await http.get<ProctoringReport>(`/proctoring/olympiads/${olympiadId}/report`);
  return data;
}
