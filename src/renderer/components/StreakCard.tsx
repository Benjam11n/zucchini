type StreakCardProps = {
  currentStreak: number;
  bestStreak: number;
};

export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  return (
    <article className="metric-card warm">
      <p className="eyebrow">Streak</p>
      <strong>{currentStreak} days</strong>
      <span>Best: {bestStreak} days</span>
    </article>
  );
}
