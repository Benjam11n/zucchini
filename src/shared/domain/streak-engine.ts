import { awardedFreezeForStreak } from "./freeze";

export type RollingStreakState = {
  currentStreak: number;
  bestStreak: number;
  availableFreezes: number;
};

export type SettledDayResult = RollingStreakState & {
  freezeUsed: boolean;
  allCompleted: boolean;
  completedAt: string | null;
};

export function settleClosedDay(
  state: RollingStreakState,
  allCompleted: boolean,
  completedAt: string | null,
): SettledDayResult {
  if (allCompleted) {
    const currentStreak = state.currentStreak + 1;
    const bestStreak = Math.max(state.bestStreak, currentStreak);
    const availableFreezes = state.availableFreezes + Number(awardedFreezeForStreak(currentStreak));

    return {
      currentStreak,
      bestStreak,
      availableFreezes,
      freezeUsed: false,
      allCompleted: true,
      completedAt,
    };
  }

  if (state.availableFreezes > 0) {
    return {
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      availableFreezes: state.availableFreezes - 1,
      freezeUsed: true,
      allCompleted: false,
      completedAt: null,
    };
  }

  return {
    currentStreak: 0,
    bestStreak: state.bestStreak,
    availableFreezes: 0,
    freezeUsed: false,
    allCompleted: false,
    completedAt: null,
  };
}

export function previewOpenDay(
  state: RollingStreakState,
  allCompleted: boolean,
): RollingStreakState {
  if (!allCompleted) {
    return state;
  }

  const currentStreak = state.currentStreak + 1;

  return {
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    availableFreezes: state.availableFreezes + Number(awardedFreezeForStreak(currentStreak)),
  };
}
