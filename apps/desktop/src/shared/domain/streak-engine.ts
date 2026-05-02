import type { DayStatusKind } from "./day-status";
/**
 * Pure streak rules for settled and in-progress days.
 *
 * This module answers questions like "what happens to the streak when a day is
 * completed, missed, or saved by a freeze?" without depending on UI or
 * persistence code.
 */
import { awardedFreezeForStreak } from "./freeze";

interface RollingStreakState {
  currentStreak: number;
  bestStreak: number;
  availableFreezes: number;
}

type SettledDayResult = RollingStreakState & {
  freezeUsed: boolean;
  allCompleted: boolean;
  completedAt: string | null;
  dayStatus: DayStatusKind | null;
};

interface ClosedDayInput {
  allCompleted: boolean;
  completedAt: string | null;
  dayStatus: DayStatusKind | null;
}

export function settleClosedDay(
  state: RollingStreakState,
  input: ClosedDayInput
): SettledDayResult {
  if (input.dayStatus === "sick") {
    return {
      allCompleted: false,
      availableFreezes: state.availableFreezes,
      bestStreak: state.bestStreak,
      completedAt: null,
      currentStreak: state.currentStreak,
      dayStatus: "sick",
      freezeUsed: false,
    };
  }

  const { allCompleted, completedAt } = input;

  if (allCompleted) {
    const currentStreak = state.currentStreak + 1;
    const bestStreak = Math.max(state.bestStreak, currentStreak);
    const availableFreezes =
      state.availableFreezes + Number(awardedFreezeForStreak(currentStreak));

    return {
      allCompleted: true,
      availableFreezes,
      bestStreak,
      completedAt,
      currentStreak,
      dayStatus: null,
      freezeUsed: false,
    };
  }

  if (state.availableFreezes > 0 && state.currentStreak > 0) {
    return {
      allCompleted: false,
      availableFreezes: state.availableFreezes - 1,
      bestStreak: state.bestStreak,
      completedAt: null,
      currentStreak: state.currentStreak,
      dayStatus: null,
      freezeUsed: true,
    };
  }

  return {
    allCompleted: false,
    availableFreezes: 0,
    bestStreak: state.bestStreak,
    completedAt: null,
    currentStreak: 0,
    dayStatus: null,
    freezeUsed: false,
  };
}

export function previewOpenDay(
  state: RollingStreakState,
  allCompleted: boolean,
  dayStatus: DayStatusKind | null = null
): RollingStreakState {
  if (dayStatus === "sick") {
    return state;
  }

  if (!allCompleted) {
    return state;
  }

  const currentStreak = state.currentStreak + 1;

  return {
    availableFreezes:
      state.availableFreezes + Number(awardedFreezeForStreak(currentStreak)),
    bestStreak: Math.max(state.bestStreak, currentStreak),
    currentStreak,
  };
}
