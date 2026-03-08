import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";

export type Tab = "today" | "history" | "settings";

export interface AppState {
  todayState: TodayState | null;
  history: HistoryDay[];
  settingsDraft: AppSettings | null;
}
