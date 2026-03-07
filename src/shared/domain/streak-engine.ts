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

  if (state.availableFreezes > 0) {
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
