import type { PersistedTodayUiState } from "@/renderer/features/today/today.types";
import type { TodayState } from "@/shared/contracts/today-state";

export function createTodayUiSnapshot(
  state: Pick<TodayState, "date" | "streak">,
  completedCount: number
): PersistedTodayUiState {
  return {
    completedCount,
    date: state.date,
    streak: state.streak,
  };
}
