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

/** Files require authentication, so they are fetched as a blob instead of a plain link. */
export async function downloadAttachment(file: Pick<FileAttachment, 'url' | 'originalName'>) {
  const path = file.url.replace(/^\/api/, '');
  const { data } = await http.get<Blob>(path, { responseType: 'blob' });
  const href = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = href;
  link.download = file.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
