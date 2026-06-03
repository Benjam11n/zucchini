import type { CategoryStreak } from "@/shared/domain/category-streak";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";

export interface HabitStatusPatch {
  categoryStreaks?: Record<HabitCategory, CategoryStreak>;
  habit: HabitWithStatus;
  habitStreaksStale: boolean;
}
