import { http } from './http';
import type { ProctoringEventPayload } from '@/types';

export async function sendProctoringEvent(payload: ProctoringEventPayload) {
  await http.post('/proctoring/event', payload);
}
