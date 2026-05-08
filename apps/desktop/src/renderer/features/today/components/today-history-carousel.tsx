import { useCallback, useEffect, useState } from "react";

import { HistoryDayPanel } from "@/renderer/features/history/components/history-day-panel";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/renderer/shared/components/ui/carousel";
import type { CarouselApi } from "@/renderer/shared/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/renderer/shared/components/ui/dialog";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

interface TodayHistoryCarouselProps {
  hasLoadedHistorySummary: boolean;
  history: HistorySummaryDay[];
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
}: TodayHistoryCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  async function handleSelectDay(date: string) {
    setSelectedDate(date);
    setSelectedDay(null);
    setSelectedDay(await habitsClient.getHistoryDay(date));
  }

  return (
    <>
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

              return (
                <CarouselItem
                  key={day.date}
                  className="basis-auto pl-2 sm:pl-4"
                >
                  <button
                    type="button"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-md p-2 transition-opacity hover:bg-background/45 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      void handleSelectDay(day.date);
                    }}
                  >
                    <HabitActivityRingGlyph
                      categoryProgress={day.categoryProgress}
                      size={48}
                    />
                    <span className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
                      {dayOfWeek}
                    </span>
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

      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
            setSelectedDay(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            History for {selectedDate}
          </DialogTitle>
          <HistoryDayPanel
            onNavigateToToday={() => {
              setSelectedDate(null);
              setSelectedDay(null);
            }}
            selectedDay={selectedDay}
            isToday={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
