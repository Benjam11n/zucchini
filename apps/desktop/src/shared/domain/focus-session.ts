export type FocusSessionEntryKind = "completed" | "partial";

export interface FocusSession {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  id: number;
  startedAt: string;
  timerSessionId: string | null;
}

export interface CreateFocusSessionInput {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  startedAt: string;
  timerSessionId: string;
}
