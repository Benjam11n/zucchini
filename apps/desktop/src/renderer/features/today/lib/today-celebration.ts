import type { PersistedTodayUiState } from "@/renderer/features/today/today.types";

const STREAK_MILESTONES = [3, 7, 14, 15, 30, 50, 75, 100] as const;

export interface TodayCelebration {
  id: string;
  isNewRecord: boolean;
  message: string;
  milestone: number | null;
  title: string;
}

interface ResolveTodayCelebrationInput {
  completedCount: number;
  dailyHabitCount: number;
  date: string;
  lastUiState: PersistedTodayUiState | null;
  streak: PersistedTodayUiState["streak"];
}

export function getReachedStreakMilestone(
  previousStreak: number,
  currentStreak: number
): number | null {
  for (const milestone of STREAK_MILESTONES.toReversed()) {
    if (previousStreak < milestone && currentStreak >= milestone) {
      return milestone;
    }
  }

  return null;
}

export function resolveTodayCelebration({
  completedCount,
  dailyHabitCount,
  date,
  lastUiState,
  streak,
}: ResolveTodayCelebrationInput): TodayCelebration | null {
  if (
    !lastUiState ||
    lastUiState.date !== date ||
    dailyHabitCount === 0 ||
    completedCount !== dailyHabitCount ||
    lastUiState.completedCount >= dailyHabitCount
  ) {
    return null;
  }

  const milestone = getReachedStreakMilestone(
    lastUiState.streak.currentStreak,
    streak.currentStreak
  );
  const isNewRecord = streak.bestStreak > lastUiState.streak.bestStreak;

  if (isNewRecord && milestone) {
    return {
      id: `record-milestone-${date}-${streak.currentStreak}`,
      isNewRecord,
      message: `${streak.currentStreak} straight days and a new personal best.`,
      milestone,
      title: `${milestone}-day milestone`,
    };
  }

  if (isNewRecord) {
    return {
      id: `record-${date}-${streak.currentStreak}`,
      isNewRecord,
      message: `${streak.currentStreak} straight days. That's your longest streak yet.`,
      milestone: null,
      title: "New streak record",
    };
  }

  if (milestone) {
    return {
      id: `milestone-${date}-${milestone}`,
      isNewRecord: false,
      message: `${streak.currentStreak} straight days. Keep the momentum going.`,
      milestone,
      title: `${milestone}-day milestone`,
    };
  }

  return {
    id: `completed-${date}-${completedCount}`,
    isNewRecord: false,
    message: "All daily habits complete. Today's streak is locked in.",
    milestone: null,
    title: "Today complete",
  };
}
