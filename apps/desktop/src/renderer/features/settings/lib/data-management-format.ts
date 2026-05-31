import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { Habit } from "@/shared/domain/habit";

export function getPathLabel(filePath: string): string {
  return filePath.split(/[/\\]/).at(-1) ?? filePath;
}

export function formatBackupSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatBackupDate(value: string | null): string {
  if (!value) {
    return "None";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toRestoreSnapshotHabit(
  habit: BackupRestorePreview["habits"][number]
): Habit {
  const frequency = normalizeHabitFrequency(habit.frequency);

  return {
    category: normalizeHabitCategory(habit.category),
    createdAt: "",
    frequency,
    id: habit.id,
    isArchived: false,
    name: habit.name,
    pausedAt: habit.pausedAt,
    selectedWeekdays: normalizeHabitWeekdays(habit.selectedWeekdays),
    sortOrder: habit.sortOrder,
    targetCount: normalizeHabitTargetCount(frequency, habit.targetCount),
  };
}
