import { create } from 'zustand';
import type { FileAttachment } from '@/types';
import {
  fetchAttachments as apiFetch,
  uploadAttachment as apiUpload,
  deleteAttachment as apiDelete,
} from '@/api/attachments';

interface AttachmentState {
  attachments: FileAttachment[];
  loading: boolean;
  error: string | null;
  fetchAttachments: (participationId: string, questionId: string) => Promise<void>;
  uploadFile: (participationId: string, questionId: string, file: File) => Promise<void>;
  removeFile: (attachmentId: string) => Promise<void>;
}

export const useAttachmentStore = create<AttachmentState>((set) => ({
  attachments: [],
  loading: false,
  error: null,

  fetchAttachments: async (participationId, questionId) => {
    set({ loading: true, error: null });
    try {
      const attachments = await apiFetch(participationId, questionId);
      set({ attachments });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  uploadFile: async (participationId, questionId, file) => {
    set({ loading: true, error: null });
    try {
      const newAttachment = await apiUpload(participationId, questionId, file);
      set((state) => ({ attachments: [...state.attachments, newAttachment] }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  removeFile: async (attachmentId) => {
    set({ loading: true, error: null });
    try {
      await apiDelete(attachmentId);
      set((state) => ({
        attachments: state.attachments.filter((a) => a.id !== attachmentId),
      }));
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));
