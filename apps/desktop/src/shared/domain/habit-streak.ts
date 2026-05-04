export interface HabitStreak {
  bestStreak: number;
  currentStreak: number;
}

export interface PersistedHabitStreakState extends HabitStreak {
  habitId: number;
  lastEvaluatedDate: string | null;
}
