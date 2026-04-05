import { useState } from "react";

import { HistoryDayPanel } from "@/renderer/features/history/components/history-day-panel";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/renderer/shared/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/renderer/shared/components/ui/dialog";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

interface TodayHistoryCarouselProps {
  history: HistoryDay[];
  todayDate: string;
}

const MAX_HISTORY_DAYS = 14;

export function TodayHistoryCarousel({
  history,
  todayDate,
}: TodayHistoryCarouselProps) {
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);

  if (!history || history.length === 0) {
    return null;
  }

  const days = [...history].slice(0, MAX_HISTORY_DAYS).toReversed();

  return (
    <>
      <div className="relative min-w-0 max-w-full overflow-hidden rounded-md border border-card bg-card/70 px-1 sm:px-2">
        <Carousel
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
                    onClick={() => setSelectedDay(day)}
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-card/95 via-card/55 to-transparent sm:w-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-card/95 via-card/55 to-transparent sm:w-10"
        />
      </div>

      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDay(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            History for {selectedDay?.date}
          </DialogTitle>
          <HistoryDayPanel
            onNavigateToToday={() => setSelectedDay(null)}
            selectedDay={selectedDay}
            isToday={selectedDay?.date === todayDate}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
