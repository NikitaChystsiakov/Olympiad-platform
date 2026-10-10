export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN';
export type OlympiadStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT' | 'CODE' | 'MANUAL_REVIEW';
export type AttemptStatus = 'ACTIVE' | 'PAUSED' | 'PENDING_REVIEW' | 'FINISHED' | 'DISQUALIFIED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProctoringEventType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'FACE_MISSING'
  | 'MULTIPLE_FACES'
  | 'COPY_PASTE'
  | 'CAMERA_UNAVAILABLE'
  | 'SUSPICIOUS_SOUND'
  | 'SCREEN_RECORDING';

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
  questionCount: number;
  totalPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface QuestionPayload {
  text: string;
  type: QuestionType;
  options?: string;
  correctAnswer?: string;
  points: number;
}

export interface Attempt {
  id: string;
  olympiadId: string;
  olympiadTitle: string;
  startedAt: string;
  deadline: string;
  finishedAt?: string | null;
  score: number | null;
  maxPossibleScore: number;
  status: AttemptStatus;
}

export interface SavedAnswer {
  questionId: string;
  answer: string;
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
  maxPoints: number;
  pendingReview?: boolean;
  reviewComment?: string;
}

export interface ParticipationResult {
  participationId: string;
  olympiadId: string;
  olympiadTitle: string;
  userName: string;
  userEmail: string;
  totalScore: number;
  maxPossibleScore: number;
  place?: number | null;
  pendingReview: boolean;
  startedAt: string;
  finishedAt?: string | null;
  status: AttemptStatus;
  answers: AnswerDetail[];
}

export interface OlympiadParticipant {
  participationId: string;
  userName: string;
  userEmail: string;
  score: number;
  maxPossibleScore: number;
  place?: number | null;
  pendingReview: boolean;
  startedAt: string;
  finishedAt?: string | null;
  status: AttemptStatus;
}

export interface FileAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface ManualReviewItem {
  participationId: string;
  answerId: string;
  questionId: string;
  questionText: string;
  userName: string;
  userEmail: string;
  userAnswer: string;
  pointsEarned?: number | null;
  maxPoints: number;
  reviewComment?: string | null;
  files?: FileAttachment[];
}

export interface ProctoringReportParticipant {
  email: string;
  fullName: string;
  participationId: string;
  participationStatus: AttemptStatus;
  totalEvents: number;
  flaggedEvents: number;
  countsByType: Partial<Record<ProctoringEventType, number>>;
  lastEventAt?: string | null;
  riskLevel: RiskLevel;
}

export interface ProctoringReportEvent {
  id: string;
  userEmail: string;
  userName: string;
  eventType: ProctoringEventType;
  metadata?: string | null;
  timestamp: string;
  flagged: boolean;
}

export interface ProctoringReport {
  olympiadId: string;
  olympiadTitle: string;
  totalEvents: number;
  flaggedEvents: number;
  participants: ProctoringReportParticipant[];
  events: ProctoringReportEvent[];
}

export interface ProctoringEventPayload {
  olympiadId: string;
  eventType: ProctoringEventType;
  metadata: string;
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

export interface ApiError {
  success: false;
  message: string;
  data?: Record<string, string> | null;
}
