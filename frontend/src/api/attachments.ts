import { http } from './http';
import type { FileAttachment } from '@/types';

export async function uploadAttachment(
  participationId: string,
  questionId: string,
  file: File,
): Promise<FileAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await http.post<FileAttachment>(
    `/participations/${participationId}/questions/${questionId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function fetchAttachments(
  participationId: string,
  questionId: string,
): Promise<FileAttachment[]> {
  const { data } = await http.get<FileAttachment[]>(
    `/participations/${participationId}/questions/${questionId}/attachments`,
  );
  return data;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await http.delete(`/attachments/${attachmentId}`);
}
