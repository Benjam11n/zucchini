export function ContributionGraphSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/45 px-4 py-3">
      <div className="flex min-w-max gap-1.5">
        {Array.from({ length: 53 }, (_week, weekIndex) => (
          <div className="grid gap-1" key={weekIndex}>
            {Array.from({ length: 7 }, (_day, dayIndex) => (
              <div
                className="size-3 rounded-[3px] bg-muted/70"
                key={`${weekIndex}-${dayIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
