import type { DayStatusKind } from "@/shared/domain/day-status";
/**
 * Shared IPC contract for habit-related renderer ↔ main communication.
 *
 * Defines the channel name constants, request/response error shape, the
 * `HabitsApi` interface the preload bridge implements, and the `TodayState`
 * type returned by most mutation endpoints. Also provides `HabitsIpcError`
 * and `toHabitsIpcError` for renderer-side error handling.
 *
 * This file is imported by main-process handlers, the preload script, and
 * renderer controller code — it is the shared contract layer.
 *
 * @see HabitsApi for the full typed API surface.
 * @see HABITS_IPC_CHANNELS for the channel name constants.
 */
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";
import type { StreakState } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { WindDownState } from "@/shared/domain/wind-down";

export type FocusTimerAction = "reset" | "toggle";
export type FocusTimerActionSource =
  | "global-shortcut"
  | "main-window"
  | "widget";

export interface FocusTimerActionRequest {
  action: FocusTimerAction;
  source: FocusTimerActionSource;
}

export interface FocusTimerShortcutRegistration {
  activeAccelerator: string | null;
  accelerator: string;
  errorMessage: string | null;
  isRegistered: boolean;
}

export interface FocusTimerShortcutStatus {
  reset: FocusTimerShortcutRegistration;
  toggle: FocusTimerShortcutRegistration;
}

// oxlint-disable-next-line eslint/sort-keys
export const HABITS_IPC_CHANNELS = {
  command: "habits:command",
  clearData: "habits:clearData",
  claimFocusTimerCycleCompletion: "habits:claimFocusTimerCycleCompletion",
  claimFocusTimerLeadership: "habits:claimFocusTimerLeadership",
  exportBackup: "habits:exportBackup",
  focusSessionRecorded: "habits:focusSessionRecorded",
  focusTimerActionRequested: "habits:focusTimerActionRequested",
  focusTimerShortcutStatusChanged: "habits:focusTimerShortcutStatusChanged",
  focusTimerStateChanged: "habits:focusTimerStateChanged",
  getDesktopNotificationStatus: "habits:getDesktopNotificationStatus",
  getFocusTimerShortcutStatus: "habits:getFocusTimerShortcutStatus",
  importBackup: "habits:importBackup",
  openDataFolder: "habits:openDataFolder",
  query: "habits:query",
  releaseFocusTimerLeadership: "habits:releaseFocusTimerLeadership",
  resizeFocusWidget: "habits:resizeFocusWidget",
  showFocusWidget: "habits:showFocusWidget",
  showMainWindow: "habits:showMainWindow",
  showNotification: "habits:showNotification",
  windDownNavigationRequested: "habits:windDownNavigationRequested",
} as const;

export type HabitsIpcErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface SerializedHabitsIpcError {
  code: HabitsIpcErrorCode;
  details?: string[];
  message: string;
}

export type HabitsIpcResponse<T> =
  | { data: T; ok: true }
  | { error: SerializedHabitsIpcError; ok: false };

export class HabitsIpcError extends Error {
  readonly code: HabitsIpcErrorCode;
  readonly details?: string[];

  constructor({ code, details, message }: SerializedHabitsIpcError) {
    super(message);
    this.code = code;
    if (details) {
      this.details = details;
    }
    this.name = "HabitsIpcError";
  }
}

export function toHabitsIpcError(error: unknown): HabitsIpcError {
  if (error instanceof HabitsIpcError) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Partial<SerializedHabitsIpcError>;
    if (
      typeof candidate.code === "string" &&
      typeof candidate.message === "string"
    ) {
      const details = Array.isArray(candidate.details)
        ? candidate.details.filter(
            (detail): detail is string => typeof detail === "string"
          )
        : undefined;

      return new HabitsIpcError({
        code: candidate.code as HabitsIpcErrorCode,
        ...(details ? { details } : {}),
        message: candidate.message,
      });
    }
  }

  return new HabitsIpcError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong while processing your request.",
  });
}

export interface TodayState {
  date: string;
  dayStatus: DayStatusKind | null;
  focusMinutes: number;
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: AppSettings;
  windDown?: WindDownState;
}

export type DesktopNotificationAvailability =
  | "available"
  | "blocked"
  | "unsupported"
  | "unknown";

export type DesktopNotificationReason =
  | "app-busy"
  | "do-not-disturb"
  | "full-screen-app"
  | "other-app-active"
  | "platform-error"
  | "presentation-mode"
  | "quiet-time"
  | "session-locked"
  | "unsupported-platform"
  | null;

export interface DesktopNotificationStatus {
  availability: DesktopNotificationAvailability;
  reason: DesktopNotificationReason;
}

export type HabitCommand =
  | { payload: { goalId: number }; type: "focusQuotaGoal.archive" }
  | { payload: { goalId: number }; type: "focusQuotaGoal.unarchive" }
  | {
      payload: { frequency: GoalFrequency; targetMinutes: number };
      type: "focusQuotaGoal.upsert";
    }
  | { payload: CreateFocusSessionInput; type: "focusSession.record" }
  | { payload: PersistedFocusTimerState; type: "focusTimer.saveState" }
  | {
      payload: {
        category: HabitCategory;
        frequency: HabitFrequency;
        name: string;
        selectedWeekdays?: HabitWeekday[] | null | undefined;
        targetCount?: number | null | undefined;
      };
      type: "habit.create";
    }
  | { payload: { habitId: number }; type: "habit.archive" }
  | { payload: { habitId: number }; type: "habit.decrementProgress" }
  | { payload: { habitId: number }; type: "habit.incrementProgress" }
  | { payload: { habitId: number; name: string }; type: "habit.rename" }
  | { payload: { habitIds: number[] }; type: "habit.reorder" }
  | { payload: { habitId: number }; type: "habit.toggle" }
  | { payload: { habitId: number }; type: "habit.unarchive" }
  | {
      payload: { category: HabitCategory; habitId: number };
      type: "habit.updateCategory";
    }
  | {
      payload: {
        frequency: HabitFrequency;
        habitId: number;
        targetCount?: number | null | undefined;
      };
      type: "habit.updateFrequency";
    }
  | {
      payload: { habitId: number; targetCount: number };
      type: "habit.updateTargetCount";
    }
  | {
      payload: { habitId: number; selectedWeekdays: HabitWeekday[] | null };
      type: "habit.updateWeekdays";
    }
  | { payload: AppSettings; type: "settings.update" }
  | { type: "today.toggleSickDay" }
  | { payload: { name: string }; type: "windDown.createAction" }
  | { payload: { actionId: number }; type: "windDown.deleteAction" }
  | {
      payload: { actionId: number; name: string };
      type: "windDown.renameAction";
    }
  | { payload: { actionId: number }; type: "windDown.toggleAction" };

export type HabitCommandResult =
  | AppSettings
  | FocusSession
  | PersistedFocusTimerState
  | TodayState;

export type HabitQuery =
  | {
      payload?: { limit?: number | undefined } | undefined;
      type: "focusSession.list";
    }
  | { type: "focusTimer.getState" }
  | { type: "habit.list" }
  | {
      payload?: { limit?: number | undefined } | undefined;
      type: "history.get";
    }
  | { type: "today.get" }
  | { payload: { weekStart: string }; type: "weeklyReview.get" }
  | { type: "weeklyReview.overview" };

export type HabitQueryResult =
  | FocusSession[]
  | Habit[]
  | HistoryDay[]
  | PersistedFocusTimerState
  | TodayState
  | WeeklyReview
  | WeeklyReviewOverview
  | null;

export interface HabitsApi {
  command: (command: HabitCommand) => Promise<HabitCommandResult>;
  clearData: () => Promise<boolean>;
  claimFocusTimerCycleCompletion: (cycleId: string) => Promise<boolean>;
  claimFocusTimerLeadership: (
    instanceId: string,
    ttlMs: number
  ) => Promise<boolean>;
  exportBackup: () => Promise<string | null>;
  getDesktopNotificationStatus: () => Promise<DesktopNotificationStatus>;
  getFocusTimerShortcutStatus: () => Promise<FocusTimerShortcutStatus>;
  importBackup: () => Promise<boolean>;
  onFocusTimerActionRequested: (
    listener: (request: FocusTimerActionRequest) => void
  ) => () => void;
  onFocusTimerShortcutStatusChanged: (
    listener: (status: FocusTimerShortcutStatus) => void
  ) => () => void;
  onWindDownNavigationRequested: (listener: () => void) => () => void;
  onFocusSessionRecorded: (
    listener: (session: FocusSession) => void
  ) => () => void;
  onFocusTimerStateChanged: (
    listener: (state: PersistedFocusTimerState) => void
  ) => () => void;
  openDataFolder: () => Promise<string>;
  query: (query: HabitQuery) => Promise<HabitQueryResult>;
  releaseFocusTimerLeadership: (instanceId: string) => Promise<void>;
  resizeFocusWidget: (width: number, height: number) => Promise<void>;
  showFocusWidget: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
}
