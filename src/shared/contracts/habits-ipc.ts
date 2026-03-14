/**
 * Shared IPC contract for habit-related renderer <-> main communication.
 *
 * This file defines the channel names, request/response error shape, and the
 * high-level API the renderer expects the preload bridge to expose.
 */
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "../domain/focus-session";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "../domain/habit";
import type { HistoryDay } from "../domain/history";
import type { AppSettings } from "../domain/settings";
import type { StreakState } from "../domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "../domain/weekly-review";

export const HABITS_IPC_CHANNELS = {
  archiveHabit: "habits:archiveHabit",
  claimFocusTimerCycleCompletion: "habits:claimFocusTimerCycleCompletion",
  claimFocusTimerLeadership: "habits:claimFocusTimerLeadership",
  createHabit: "habits:createHabit",
  exportBackup: "habits:exportBackup",
  focusSessionRecorded: "habits:focusSessionRecorded",
  getFocusSessions: "habits:getFocusSessions",
  getHabits: "habits:getHabits",
  getHistory: "habits:getHistory",
  getTodayState: "habits:getTodayState",
  getWeeklyReview: "habits:getWeeklyReview",
  getWeeklyReviewOverview: "habits:getWeeklyReviewOverview",
  importBackup: "habits:importBackup",
  openDataFolder: "habits:openDataFolder",
  recordFocusSession: "habits:recordFocusSession",
  releaseFocusTimerLeadership: "habits:releaseFocusTimerLeadership",
  renameHabit: "habits:renameHabit",
  reorderHabits: "habits:reorderHabits",
  resizeFocusWidget: "habits:resizeFocusWidget",
  showFocusWidget: "habits:showFocusWidget",
  showMainWindow: "habits:showMainWindow",
  showNotification: "habits:showNotification",
  toggleHabit: "habits:toggleHabit",
  unarchiveHabit: "habits:unarchiveHabit",
  updateHabitCategory: "habits:updateHabitCategory",
  updateHabitFrequency: "habits:updateHabitFrequency",
  updateHabitWeekdays: "habits:updateHabitWeekdays",
  updateSettings: "habits:updateSettings",
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
    this.details = details;
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
      return new HabitsIpcError({
        code: candidate.code as HabitsIpcErrorCode,
        details: Array.isArray(candidate.details)
          ? candidate.details.filter(
              (detail): detail is string => typeof detail === "string"
            )
          : undefined,
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
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: AppSettings;
}

export interface HabitApi {
  claimFocusTimerCycleCompletion: (cycleId: string) => Promise<boolean>;
  claimFocusTimerLeadership: (
    instanceId: string,
    ttlMs: number
  ) => Promise<boolean>;
  exportBackup: () => Promise<string | null>;
  getFocusSessions: (limit?: number) => Promise<FocusSession[]>;
  getHabits: () => Promise<Habit[]>;
  getHistory: (limit?: number) => Promise<HistoryDay[]>;
  getTodayState: () => Promise<TodayState>;
  getWeeklyReview: (weekStart: string) => Promise<WeeklyReview>;
  getWeeklyReviewOverview: () => Promise<WeeklyReviewOverview>;
  importBackup: () => Promise<boolean>;
  onFocusSessionRecorded: (
    listener: (session: FocusSession) => void
  ) => () => void;
  openDataFolder: () => Promise<string>;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  releaseFocusTimerLeadership: (instanceId: string) => Promise<void>;
  resizeFocusWidget: (width: number, height: number) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<AppSettings>;
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ) => Promise<TodayState>;
  renameHabit: (habitId: number, name: string) => Promise<TodayState>;
  updateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<TodayState>;
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<TodayState>;
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<TodayState>;
  archiveHabit: (habitId: number) => Promise<TodayState>;
  unarchiveHabit: (habitId: number) => Promise<TodayState>;
  reorderHabits: (habitIds: number[]) => Promise<TodayState>;
  showFocusWidget: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
}
