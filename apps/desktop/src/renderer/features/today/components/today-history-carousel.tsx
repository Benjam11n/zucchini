import { useCallback, useEffect, useState } from "react";

import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import {
  getActivityBadgeLabel,
  getActivityStatus,
} from "@/renderer/features/history/lib/history-summary";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Badge } from "@/renderer/shared/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/renderer/shared/components/ui/carousel";
import type { CarouselApi } from "@/renderer/shared/components/ui/carousel";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistorySummaryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

interface TodayHistoryCarouselProps {
  hasLoadedHistorySummary: boolean;
  history: HistorySummaryDay[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

const MAX_HISTORY_DAYS = 14;
const HISTORY_SKELETON_ITEMS = Array.from(
  { length: MAX_HISTORY_DAYS },
  (_, index) => `history-skeleton-${index}`
);

function TodayHistoryCarouselSkeleton() {
  return (
    <div
      aria-label="Loading recent history"
      className="relative flex h-[5.75rem] min-w-0 max-w-full justify-end overflow-hidden rounded-md bg-card px-1 ring-1 ring-foreground/10 sm:px-2"
    >
      <div className="flex min-w-full justify-end gap-2 sm:gap-4">
        {HISTORY_SKELETON_ITEMS.map((skeletonItem) => (
          <div
            className="flex shrink-0 flex-col items-center gap-2 rounded-md p-2"
            key={skeletonItem}
          >
            <div className="size-12 animate-pulse rounded-full bg-muted" />
            <div className="h-2 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodayHistoryCarousel({
  hasLoadedHistorySummary,
  history,
  onSelectDate,
  selectedDate,
}: TodayHistoryCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback((api: CarouselApi) => {
    if (!api) {
      return;
    }

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    updateScrollState(carouselApi);
    carouselApi.on("reInit", updateScrollState);
    carouselApi.on("select", updateScrollState);
    carouselApi.on("settle", updateScrollState);

    return () => {
      carouselApi.off("reInit", updateScrollState);
      carouselApi.off("select", updateScrollState);
      carouselApi.off("settle", updateScrollState);
    };
  }, [carouselApi, updateScrollState]);

  if (!hasLoadedHistorySummary && history.length === 0) {
    return <TodayHistoryCarouselSkeleton />;
  }

  if (history.length === 0) {
    return null;
  }

  const days = [...history].slice(0, MAX_HISTORY_DAYS).toReversed();

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden rounded-md bg-card px-1 text-card-foreground ring-1 ring-foreground/10 sm:px-2">
      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: "start",
          dragFree: true,
          startIndex: Math.max(days.length - 1, 0),
        }}
        className="min-w-0 max-w-full overflow-hidden overscroll-x-contain"
      >
        <CarouselContent className="ml-0">
          {days.map((day) => {
            const dayOfWeek = formatDateKey(day.date, { weekday: "short" });
            const isSelected = day.date === selectedDate;
            const activityStatus = getActivityStatus(day.summary, false);
            const activityLabel = getActivityBadgeLabel(day.summary, false);
            const showStatusLabel = activityStatus !== "complete";

            return (
              <CarouselItem key={day.date} className="basis-auto pl-2 sm:pl-4">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-md p-2 transition-opacity hover:bg-background/45 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => {
                    onSelectDate(day.date);
                  }}
                >
                  <HabitActivityRingGlyph
                    categoryProgress={day.categoryProgress}
                    size={48}
                  />
                  <span className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
                    {dayOfWeek}
                  </span>
                  {showStatusLabel ? (
                    <Badge
                      className={cn(
                        "px-1.5 py-0 text-[0.58rem] leading-none",
                        HISTORY_STATUS_UI[activityStatus].badgeClassName
                      )}
                      variant="outline"
                    >
                      {activityLabel}
                    </Badge>
                  ) : null}
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      {canScrollPrev ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-card/95 via-card/55 to-transparent sm:w-10"
        />
      ) : null}
      {canScrollNext ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-card/95 via-card/55 to-transparent sm:w-10"
        />
      ) : null}
    </div>
  );
}
