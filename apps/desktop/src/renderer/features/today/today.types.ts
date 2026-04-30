/**
 * Today page type definitions.
 *
 * Defines the persisted UI snapshot used to detect state changes for
 * celebration triggers and popup notifications.
 */
import type { TodayState } from "@/shared/contracts/today-state";

export interface PersistedTodayUiState {
  completedCount: number;
  date: string;
  streak: TodayState["streak"];
}
