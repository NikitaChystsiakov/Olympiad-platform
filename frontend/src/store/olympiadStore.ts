import { create } from 'zustand';
import { getOlympiads } from '@/api/olympiads';
import type { Olympiad, OlympiadStatus } from '@/types';

interface OlympiadState {
  olympiads: Olympiad[];
  totalPages: number;
  totalElements: number;
  page: number;
  status: OlympiadStatus | '';
  search: string;
  isLoading: boolean;
  setPage: (page: number) => void;
  setStatus: (status: OlympiadStatus | '') => void;
  setSearch: (value: string) => void;
  fetchOlympiads: () => Promise<void>;
}

export const useOlympiadStore = create<OlympiadState>((set, get) => ({
  olympiads: [],
  totalPages: 0,
  totalElements: 0,
  page: 0,
  status: '',
  search: '',
  isLoading: false,
  setPage: (page) => set({ page }),
  setStatus: (status) => set({ status }),
  setSearch: (search) => set({ search }),
  fetchOlympiads: async () => {
    const { page, status, search } = get();
    set({ isLoading: true });
    try {
      const response = await getOlympiads({
        page,
        size: 20,
        status: status || undefined,
        search: search || undefined,
      });
      set({
        olympiads: response.content || [],  // ← фикс: пустой массив если undefined
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
      });
    } catch (error) {
      console.error('Failed to fetch olympiads:', error);
      set({ olympiads: [], totalPages: 0, totalElements: 0 });  // ← сбрасываем при ошибке
    } finally {
      set({ isLoading: false });
    }
  },
}));
