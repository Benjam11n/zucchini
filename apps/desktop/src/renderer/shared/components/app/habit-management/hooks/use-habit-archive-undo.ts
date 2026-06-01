import { useTimedUndo } from "@/renderer/shared/hooks/use-timed-undo";

import type { RecentArchivedHabit } from "../habit-management-content/habit-management-content.types";

const ARCHIVE_UNDO_TIMEOUT_MS = 5000;

export function useHabitArchiveUndo() {
  return useTimedUndo<RecentArchivedHabit>({
    isCurrent: (current, next) => current.habitId === next.habitId,
    timeoutMs: ARCHIVE_UNDO_TIMEOUT_MS,
  });
}
