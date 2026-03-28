import type { TodayState } from "@/shared/contracts/habits-ipc";

export interface PersistedTodayUiState {
  completedCount: number;
  date: string;
  streak: TodayState["streak"];
}
