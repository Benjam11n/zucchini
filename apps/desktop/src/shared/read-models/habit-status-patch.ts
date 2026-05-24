import type { HabitWithStatus } from "@/shared/domain/habit";

export interface HabitStatusPatch {
  habit: HabitWithStatus;
  habitStreaksStale: boolean;
}
