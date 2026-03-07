export function awardedFreezeForStreak(streak: number): boolean {
  return streak > 0 && streak % 15 === 0;
}
