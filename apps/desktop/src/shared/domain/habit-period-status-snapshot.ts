import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export interface HabitPeriodStatusSnapshot {
  category: HabitCategory;
  completed: boolean;
  completedAt?: string | null;
  completedCount?: number;
  createdAt?: string;
  frequency: HabitFrequency;
  habitId: number;
  name: string;
  periodEnd: string;
  periodStart: string;
  selectedWeekdays?: HabitWeekday[] | null;
  sortOrder: number;
  targetCount?: number;
}
