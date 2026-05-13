import { create } from 'zustand';
import type { Participation, ParticipationResult, Question } from '@/types';

interface ParticipationState {
  activeParticipation: Participation | null;
  questions: Question[];
  answers: Record<string, string>;
  setActiveParticipation: (value: Participation | null) => void;
  setQuestions: (value: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  resetSession: () => void;
  result: ParticipationResult | null;
  setResult: (value: ParticipationResult | null) => void;
}

export const useParticipationStore = create<ParticipationState>((set) => ({
  activeParticipation: null,
  questions: [],
  answers: {},
  result: null,
  setActiveParticipation: (value) => set({ activeParticipation: value }),
  setQuestions: (value) => set({ questions: value }),
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  resetSession: () => set({ activeParticipation: null, questions: [], answers: {} }),
  setResult: (value) => set({ result: value }),
}));
