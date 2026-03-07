interface FreezeCardProps {
  availableFreezes: number;
}

export function FreezeCard({ availableFreezes }: FreezeCardProps) {
  return (
    <article className="metric-card cool">
      <p className="eyebrow">Freezes</p>
      <strong>{availableFreezes}</strong>
      <span>Earn +1 every 15 streak days</span>
    </article>
  );
}
