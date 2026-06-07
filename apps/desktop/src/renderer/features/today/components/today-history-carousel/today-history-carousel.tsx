import { m } from "framer-motion";

import { TodayHistoryCarouselSkeleton } from "@/renderer/features/today/components/today-history-carousel-skeleton/today-history-carousel-skeleton";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/app/activity-ring/habit-activity-ring-glyph";
import { HistoryStatusBadge } from "@/renderer/shared/components/app/history-status/history-status-badge";
import { Carousel } from "@/renderer/shared/components/ui/carousel";
import { CarouselContent } from "@/renderer/shared/components/ui/carousel-content";
import { CarouselItem } from "@/renderer/shared/components/ui/carousel-item";
import { CarouselOverflowFade } from "@/renderer/shared/components/ui/carousel-overflow-fade";
import { cn } from "@/renderer/shared/lib/class-names";
import { getActivityStatus } from "@/renderer/shared/lib/history-summary";
import { tapPress } from "@/renderer/shared/lib/motion";
import { formatDateKey } from "@/shared/domain/date-key";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface TodayHistoryCarouselProps {
  hasLoadedHistorySummary: boolean;
  history: HistorySummaryDay[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

const MAX_HISTORY_DAYS = 14;
const HISTORY_CAROUSEL_HEIGHT_CLASS = "h-28";
const HISTORY_SKELETON_ITEMS = Array.from(
  { length: MAX_HISTORY_DAYS },
  (_, index) => `history-skeleton-${index}`
);

export function TodayHistoryCarousel({
  hasLoadedHistorySummary,
  history,
  onSelectDate,
  selectedDate,
}: TodayHistoryCarouselProps) {
  if (!hasLoadedHistorySummary && history.length === 0) {
    return (
      <TodayHistoryCarouselSkeleton
        className={HISTORY_CAROUSEL_HEIGHT_CLASS}
        items={HISTORY_SKELETON_ITEMS}
      />
    );
  }

  if (history.length === 0) {
    return null;
  }

  const days = [...history].slice(0, MAX_HISTORY_DAYS).toReversed();

  return (
    <div
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden rounded-md bg-card px-1 text-card-foreground ring-1 ring-foreground/10 sm:px-2",
        HISTORY_CAROUSEL_HEIGHT_CLASS
      )}
    >
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          startIndex: Math.max(days.length - 1, 0),
        }}
        className="flex h-full min-w-0 max-w-full items-center overflow-hidden overscroll-x-contain"
      >
        <CarouselContent className="ml-0 items-center">
          {days.map((day) => {
            const dayOfWeek = formatDateKey(day.date, "shortWeekday");
            const isSelected = day.date === selectedDate;
            const activityStatus = getActivityStatus(day.summary, false);

            return (
              <CarouselItem key={day.date} className="basis-auto pl-2 sm:pl-4">
                <m.button
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 opacity-80 transition-opacity duration-150 hover:opacity-100 focus-visible:outline-none",
                    isSelected && "opacity-100"
                  )}
                  onClick={() => {
                    onSelectDate(day.date);
                  }}
                  whileTap={tapPress}
                >
                  <HabitActivityRingGlyph
                    categoryProgress={day.categoryProgress}
                    size={48}
                  />
                  <span
                    className={cn(
                      "text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase",
                      isSelected && "text-foreground"
                    )}
                  >
                    {dayOfWeek}
                  </span>
                  <HistoryStatusBadge
                    className={cn(isSelected && "border-primary/45")}
                    compact
                    status={activityStatus}
                  />
                </m.button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselOverflowFade
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-card/95 via-card/55 to-transparent sm:w-10"
          side="previous"
        />
        <CarouselOverflowFade
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-card/95 via-card/55 to-transparent sm:w-10"
          side="next"
        />
      </Carousel>
    </div>
  );
}
