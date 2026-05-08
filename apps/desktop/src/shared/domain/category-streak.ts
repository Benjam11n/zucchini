import type { HabitCategory } from "@/shared/domain/habit";

export interface CategoryStreak {
  bestStreak: number;
  category: HabitCategory;
  currentStreak: number;
}

export interface PersistedCategoryStreakState extends CategoryStreak {
  lastEvaluatedDate: string | null;
}
