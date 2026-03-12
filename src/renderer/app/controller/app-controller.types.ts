import type {
  FocusSessionsPhase,
  PersistedFocusTimerState,
} from "@/renderer/features/focus/focus.types";
import type { WeeklyReviewPhase } from "@/renderer/features/history/history.types";
import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import type { HabitsIpcError, TodayState } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { HistoryDay } from "@/shared/domain/history";
import type { OnboardingStatus } from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export interface AppControllerState {
  bootError: HabitsIpcError | null;
  bootPhase: "error" | "loading" | "ready";
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: HabitsIpcError | null;
  focusSessionsPhase: FocusSessionsPhase;
  hasLoadedFocusSessions: boolean;
  history: HistoryDay[];
  historyLoadError: HabitsIpcError | null;
  historyScope: "full" | "recent";
  isHistoryLoading: boolean;
  isOnboardingOpen: boolean;
  isWeeklyReviewSpotlightOpen: boolean;
  onboardingError: HabitsIpcError | null;
  onboardingPhase: "idle" | "submitting";
  onboardingStatus: OnboardingStatus | null;
  selectedWeeklyReview: WeeklyReview | null;
  settingsDraft: AppSettings | null;
  settingsFieldErrors: SettingsFieldErrors;
  settingsSaveErrorMessage: string | null;
  settingsSavePhase: SettingsSavePhase;
  timerState: PersistedFocusTimerState;
  todayState: TodayState | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
}
