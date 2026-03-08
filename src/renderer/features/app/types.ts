import type { HabitsIpcError, TodayState } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export type Tab = "today" | "history" | "settings";
export type SettingsSavePhase =
  | "idle"
  | "pending"
  | "invalid"
  | "saving"
  | "saved"
  | "error";
export type SettingsFieldErrors = Partial<Record<keyof AppSettings, string>>;
export type WeeklyReviewPhase = "error" | "idle" | "loading" | "ready";

export interface AppState {
  bootError: HabitsIpcError | null;
  bootPhase: "error" | "loading" | "ready";
  todayState: TodayState | null;
  history: HistoryDay[];
  isWeeklyReviewSpotlightOpen: boolean;
  settingsDraft: AppSettings | null;
  settingsFieldErrors: SettingsFieldErrors;
  settingsSaveErrorMessage: string | null;
  settingsSavePhase: SettingsSavePhase;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
}
