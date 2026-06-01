import { cn } from "@/renderer/shared/lib/class-names";

interface TodayHistoryCarouselSkeletonProps {
  className: string;
  items: string[];
}

export function TodayHistoryCarouselSkeleton({
  className,
  items,
}: TodayHistoryCarouselSkeletonProps) {
  return (
    <div
      aria-label="Loading recent history"
      className={cn(
        "relative flex min-w-0 max-w-full justify-end overflow-hidden rounded-md bg-card px-1 ring-1 ring-foreground/10 sm:px-2",
        className
      )}
    >
      <div className="flex min-w-full justify-end gap-2 sm:gap-4">
        {items.map((skeletonItem) => (
          <div
            className="flex shrink-0 flex-col items-center gap-2 rounded-md p-2"
            key={skeletonItem}
          >
            <div className="size-12 animate-pulse rounded-full bg-muted" />
            <div className="h-2 w-8 animate-pulse rounded-full bg-muted" />
            <div className="size-4 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
