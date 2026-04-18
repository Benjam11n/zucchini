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
  archiveFocusQuotaGoal: "habits:archiveFocusQuotaGoal",
  archiveHabit: "habits:archiveHabit",
  clearData: "habits:clearData",
  claimFocusTimerCycleCompletion: "habits:claimFocusTimerCycleCompletion",
  claimFocusTimerLeadership: "habits:claimFocusTimerLeadership",
  createHabit: "habits:createHabit",
  decrementHabitProgress: "habits:decrementHabitProgress",
  exportBackup: "habits:exportBackup",
  focusSessionRecorded: "habits:focusSessionRecorded",
  focusTimerActionRequested: "habits:focusTimerActionRequested",
  focusTimerShortcutStatusChanged: "habits:focusTimerShortcutStatusChanged",
  focusTimerStateChanged: "habits:focusTimerStateChanged",
  getDesktopNotificationStatus: "habits:getDesktopNotificationStatus",
  getFocusSessions: "habits:getFocusSessions",
  getFocusTimerShortcutStatus: "habits:getFocusTimerShortcutStatus",
  getFocusTimerState: "habits:getFocusTimerState",
  getHabits: "habits:getHabits",
  getHistory: "habits:getHistory",
  getTodayState: "habits:getTodayState",
  getWeeklyReview: "habits:getWeeklyReview",
  getWeeklyReviewOverview: "habits:getWeeklyReviewOverview",
  importBackup: "habits:importBackup",
  incrementHabitProgress: "habits:incrementHabitProgress",
  openDataFolder: "habits:openDataFolder",
  recordFocusSession: "habits:recordFocusSession",
  releaseFocusTimerLeadership: "habits:releaseFocusTimerLeadership",
  renameHabit: "habits:renameHabit",
  reorderHabits: "habits:reorderHabits",
  resizeFocusWidget: "habits:resizeFocusWidget",
  saveFocusTimerState: "habits:saveFocusTimerState",
  showFocusWidget: "habits:showFocusWidget",
  showMainWindow: "habits:showMainWindow",
  showNotification: "habits:showNotification",
  toggleSickDay: "habits:toggleSickDay",
  toggleHabit: "habits:toggleHabit",
  toggleWindDownAction: "habits:toggleWindDownAction",
  unarchiveFocusQuotaGoal: "habits:unarchiveFocusQuotaGoal",
  unarchiveHabit: "habits:unarchiveHabit",
  upsertFocusQuotaGoal: "habits:upsertFocusQuotaGoal",
  createWindDownAction: "habits:createWindDownAction",
  deleteWindDownAction: "habits:deleteWindDownAction",
  renameWindDownAction: "habits:renameWindDownAction",
  updateHabitCategory: "habits:updateHabitCategory",
  updateHabitFrequency: "habits:updateHabitFrequency",
  updateHabitTargetCount: "habits:updateHabitTargetCount",
  updateHabitWeekdays: "habits:updateHabitWeekdays",
  updateSettings: "habits:updateSettings",
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

export interface HabitsApi {
  clearData: () => Promise<boolean>;
  claimFocusTimerCycleCompletion: (cycleId: string) => Promise<boolean>;
  claimFocusTimerLeadership: (
    instanceId: string,
    ttlMs: number
  ) => Promise<boolean>;
  exportBackup: () => Promise<string | null>;
  getDesktopNotificationStatus: () => Promise<DesktopNotificationStatus>;
  getFocusSessions: (limit?: number) => Promise<FocusSession[]>;
  getFocusTimerState: () => Promise<PersistedFocusTimerState | null>;
  getFocusTimerShortcutStatus: () => Promise<FocusTimerShortcutStatus>;
  getHabits: () => Promise<Habit[]>;
  getHistory: (limit?: number) => Promise<HistoryDay[]>;
  getTodayState: () => Promise<TodayState>;
  getWeeklyReview: (weekStart: string) => Promise<WeeklyReview>;
  getWeeklyReviewOverview: () => Promise<WeeklyReviewOverview>;
  importBackup: () => Promise<boolean>;
  incrementHabitProgress: (habitId: number) => Promise<TodayState>;
  decrementHabitProgress: (habitId: number) => Promise<TodayState>;
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
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  releaseFocusTimerLeadership: (instanceId: string) => Promise<void>;
  resizeFocusWidget: (width: number, height: number) => Promise<void>;
  saveFocusTimerState: (
    state: PersistedFocusTimerState
  ) => Promise<PersistedFocusTimerState>;
  updateSettings: (settings: AppSettings) => Promise<AppSettings>;
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<TodayState>;
  renameHabit: (habitId: number, name: string) => Promise<TodayState>;
  updateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<TodayState>;
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) => Promise<TodayState>;
  updateHabitTargetCount: (
    habitId: number,
    targetCount: number
  ) => Promise<TodayState>;
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<TodayState>;
  archiveHabit: (habitId: number) => Promise<TodayState>;
  archiveFocusQuotaGoal: (goalId: number) => Promise<TodayState>;
  unarchiveHabit: (habitId: number) => Promise<TodayState>;
  unarchiveFocusQuotaGoal: (goalId: number) => Promise<TodayState>;
  upsertFocusQuotaGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<TodayState>;
  reorderHabits: (habitIds: number[]) => Promise<TodayState>;
  showFocusWidget: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
  toggleSickDay: () => Promise<TodayState>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
  toggleWindDownAction: (actionId: number) => Promise<TodayState>;
  createWindDownAction: (name: string) => Promise<TodayState>;
  deleteWindDownAction: (actionId: number) => Promise<TodayState>;
  renameWindDownAction: (actionId: number, name: string) => Promise<TodayState>;
}
