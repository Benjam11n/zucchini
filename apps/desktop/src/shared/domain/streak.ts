/**
 * Streak domain types.
 *
 * Defines the persisted streak tracking state and the daily summary record
 * written after each day settles. These types are shared between the main
 * process (persistence layer) and the renderer (display layer).
 */
export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  availableFreezes: number;
  lastEvaluatedDate: string | null;
}

export interface DailySummary {
  date: string;
  allCompleted: boolean;
  streakCountAfterDay: number;
  freezeUsed: boolean;
  completedAt: string | null;
}
