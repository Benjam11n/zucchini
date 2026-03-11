export interface FocusSession {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  id: number;
  startedAt: string;
}

export interface CreateFocusSessionInput {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  startedAt: string;
}
