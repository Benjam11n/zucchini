import { m } from "framer-motion";
import { useEffect, useState } from "react";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { HistoryStatusBadge } from "@/renderer/shared/components/history-status/history-status-badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/renderer/shared/components/ui/carousel";
import type { CarouselApi } from "@/renderer/shared/components/ui/carousel";
import { cn } from "@/renderer/shared/lib/class-names";
import { getActivityStatus } from "@/renderer/shared/lib/history-summary";
import { hoverLift, tapPress } from "@/renderer/shared/lib/motion";
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
            <div className="size-4 animate-pulse rounded-full bg-muted" />
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

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateScrollState = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateScrollState();
    carouselApi.on("reInit", updateScrollState);
    carouselApi.on("select", updateScrollState);
    carouselApi.on("settle", updateScrollState);

    return () => {
      carouselApi.off("reInit", updateScrollState);
      carouselApi.off("select", updateScrollState);
      carouselApi.off("settle", updateScrollState);
    };
  }, [carouselApi]);

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

            return (
              <CarouselItem key={day.date} className="basis-auto pl-2 sm:pl-4">
                <m.button
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-md p-2 transition-all duration-150 hover:bg-background/45 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected &&
                      "selected-day-pulse bg-primary/8 ring-2 ring-primary/35 shadow-sm"
                  )}
                  onClick={() => {
                    onSelectDate(day.date);
                  }}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <HabitActivityRingGlyph
                    categoryProgress={day.categoryProgress}
                    size={48}
                  />
                  <span className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
                    {dayOfWeek}
                  </span>
                  <HistoryStatusBadge compact status={activityStatus} />
                </m.button>
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
