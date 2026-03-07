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

function countCompletedHabits(completed: boolean[]): number {
  return completed.filter(Boolean).length;
}

export function getProgress(completed: boolean[], total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((countCompletedHabits(completed) / total) * 100);
}
