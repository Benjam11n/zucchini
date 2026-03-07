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
