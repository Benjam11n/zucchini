import type { PersistedTodayUiState } from "@/renderer/features/today/today.types";
import type { TodayState } from "@/shared/contracts/habits-ipc";

export function createTodayUiSnapshot(
  state: TodayState,
  completedCount: number
): PersistedTodayUiState {
  return {
    completedCount,
    date: state.date,
    streak: state.streak,
  };
}
