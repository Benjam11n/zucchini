import type { HabitWithStatus } from "@/shared/domain/habit";
import type { WindDownActionWithStatus } from "@/shared/domain/wind-down";

export function toChecklistHabit(
  action: WindDownActionWithStatus
): HabitWithStatus {
  return {
    category: "productivity",
    completed: action.completed,
    completedCount: action.completed ? 1 : 0,
    createdAt: action.createdAt,
    frequency: "daily",
    id: action.id,
    isArchived: false,
    name: action.name,
    sortOrder: action.sortOrder,
    targetCount: 1,
  };
}
