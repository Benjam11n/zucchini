import type { TodayState } from "@/shared/contracts/habits-ipc";

export interface PopupEvent {
  id: string;
  mascot: string;
  message: string;
  title: string;
}

export interface PersistedTodayUiState {
  completedCount: number;
  date: string;
  streak: TodayState["streak"];
}
