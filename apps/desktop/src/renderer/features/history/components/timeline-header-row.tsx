export function TimelineHeaderRow() {
  return (
    <div className="grid grid-cols-[72px_1fr_72px_88px_72px_24px] items-center gap-3 border-b border-border/60 bg-muted/25 px-3 py-2 text-xs font-medium text-muted-foreground">
      <span>Day</span>
      <span>Date</span>
      <span>Complete</span>
      <span>Focus</span>
      <span>Status</span>
      <span className="text-right">Misses</span>
    </div>
  );
}
