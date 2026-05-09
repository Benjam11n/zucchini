import { APP_CONFIG } from "@/shared/config/app-config";

/**
 * Streak freeze (pause) rules.
 *
 * A freeze lets the user miss a day without breaking their streak.
 * One freeze is awarded for every 7-day streak milestone, plus one more for
 * every 30-day streak milestone.
 */
export function awardedFreezeCountForStreak(streak: number): number {
  if (streak <= 0) {
    return 0;
  }

  const { monthlyStreakDays, weeklyStreakDays } =
    APP_CONFIG.streaks.freezeAwards;

  return (
    Number(streak % weeklyStreakDays === 0) +
    Number(streak % monthlyStreakDays === 0)
  );
}
