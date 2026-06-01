/**
 * Today page type definitions.
 *
 * Defines the persisted UI snapshot used to detect state changes for
 * celebration triggers and popup notifications.
 */
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";
import type { TodayState } from "@/shared/read-models/today-state";

export interface TodayPageActions {
  habits: HabitManagementActions & {
    decrementProgress: (habitId: number) => void;
    incrementProgress: (habitId: number) => void;
    toggleCarryover: (sourceDate: string, habitId: number) => void;
    toggleHabit: (habitId: number) => void;
  };
  history: {
    loadDay: (date: string) => void;
  };
}

export interface PersistedTodayUiState {
  completedCount: number;
  date: string;
  streak: TodayState["streak"];
}
