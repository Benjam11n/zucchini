import type {
  HabitCategory,
  HabitFrequency,
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
  createHabit: "habits:createHabit",
  getHistory: "habits:getHistory",
  getTodayState: "habits:getTodayState",
  getWeeklyReview: "habits:getWeeklyReview",
  getWeeklyReviewOverview: "habits:getWeeklyReviewOverview",
  renameHabit: "habits:renameHabit",
  reorderHabits: "habits:reorderHabits",
  showNotification: "habits:showNotification",
  toggleHabit: "habits:toggleHabit",
  updateHabitCategory: "habits:updateHabitCategory",
  updateHabitFrequency: "habits:updateHabitFrequency",
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
  getTodayState: () => Promise<TodayState>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
  getHistory: () => Promise<HistoryDay[]>;
  getWeeklyReview: (weekStart: string) => Promise<WeeklyReview>;
  getWeeklyReviewOverview: () => Promise<WeeklyReviewOverview>;
  updateSettings: (settings: AppSettings) => Promise<AppSettings>;
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
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
  archiveHabit: (habitId: number) => Promise<TodayState>;
  reorderHabits: (habitIds: number[]) => Promise<TodayState>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
}
