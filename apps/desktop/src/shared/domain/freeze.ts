/**
 * Streak freeze (pause) rules.
 *
 * A freeze lets the user miss a day without breaking their streak.
 * One freeze is awarded for every 15-day streak milestone.
 */
export function awardedFreezeForStreak(streak: number): boolean {
  return streak > 0 && streak % 15 === 0;
}
