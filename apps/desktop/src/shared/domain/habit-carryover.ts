import type { HabitWithStatus } from "@/shared/domain/habit";

export interface HabitCarryover extends HabitWithStatus {
  sourceDate: string;
  targetDate: string;
}
