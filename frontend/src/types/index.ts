export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN';
export type OlympiadStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'FINISHED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT' | 'CODE' | 'MANUAL_REVIEW';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserPayload {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  active?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Olympiad {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: OlympiadStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  points: number;
}

export interface QuestionPayload {
  text: string;
  type: QuestionType;
  options?: string;
  correctAnswer?: string;
  points: number;
}

export interface Participation {
  id: string;
  olympiadId: string;
  olympiadTitle: string;
  userEmail?: string;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  status: string;
}

export interface AnswerDetail {
  questionId: string;
  questionText: string;
  questionType?: QuestionType;
  options?: string;
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints?: number;
  pendingReview?: boolean;
  reviewComment?: string;
}

export interface ParticipationResult {
  id: string;
  olympiadId: string;
  olympiadTitle: string;
  userEmail?: string;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  status: string;
  place?: number;
  pendingReview?: boolean;
  totalScore: number;
  maxPossibleScore: number;
  answers: AnswerDetail[];
}

export interface OlympiadParticipant {
  participationId: string;
  userName: string;
  userEmail: string;
  score: number;
  maxPossibleScore: number;
  place?: number;
  pendingReview: boolean;
  startedAt: string;
  finishedAt?: string;
  status: string;
}

export interface ManualReviewItem {
  participationId: string;
  answerId: string;
  questionId: string;
  questionText: string;
  userName: string;
  userEmail: string;
  userAnswer: string;
  pointsEarned?: number;
  maxPoints: number;
  reviewComment?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ApiMessage {
  success: boolean;
  message: string;
}

export interface ProctoringEventPayload {
  olympiadId: string;
  eventType: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'FACE_MISSING' | 'SUSPICIOUS_FLAG';
  metadata: string;
}

export interface LocalProctoringEntry {
  id: string;
  olympiadId: string;
  userEmail: string;
  userName: string;
  eventType: string;
  metadata: string;
  createdAt: string;
  isFlagged: boolean;
}
