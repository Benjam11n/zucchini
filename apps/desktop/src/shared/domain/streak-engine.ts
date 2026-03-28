/**
 * Pure streak rules for settled and in-progress days.
 *
 * This module answers questions like "what happens to the streak when a day is
 * completed, missed, or saved by a freeze?" without depending on UI or
 * persistence code.
 */
import { awardedFreezeForStreak } from "./freeze";

export interface RollingStreakState {
  currentStreak: number;
  bestStreak: number;
  availableFreezes: number;
}

export type SettledDayResult = RollingStreakState & {
  freezeUsed: boolean;
  allCompleted: boolean;
  completedAt: string | null;
};

export function settleClosedDay(
  state: RollingStreakState,
  allCompleted: boolean,
  completedAt: string | null
): SettledDayResult {
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
      freezeUsed: true,
    };
  }

  return {
    allCompleted: false,
    availableFreezes: 0,
    bestStreak: state.bestStreak,
    completedAt: null,
    currentStreak: 0,
    freezeUsed: false,
  };
}

export function previewOpenDay(
  state: RollingStreakState,
  allCompleted: boolean
): RollingStreakState {
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
