import type { HabitFrequency } from "@/shared/domain/habit";

export function getMaximumTargetCount(
  frequency: Exclude<HabitFrequency, "daily">
) {
  return frequency === "weekly" ? 7 : 31;
}
