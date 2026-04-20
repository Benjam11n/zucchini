import { LazyMotion, domAnimation, m } from "framer-motion";
import { createContext, useContext, useMemo } from "react";
import type { DayButtonProps } from "react-day-picker";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Calendar } from "@/renderer/shared/components/ui/calendar";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { HistoryDay } from "@/shared/domain/history";
import { parseDateKey, toDateKey } from "@/shared/utils/date";

interface HistoryCalendarCardProps {
  historyByDate: Map<string, HistoryDay>;
  onSelectDateKey: (dateKey: string) => void;
  selectedDay: HistoryDay | null;
  setVisibleMonth: (date: Date | undefined) => void;
  visibleMonth: Date | undefined;
}

interface HistoryCalendarDayButtonProps extends DayButtonProps {
  historyByDate: Map<string, HistoryDay>;
  onSelectDateKey: (dateKey: string) => void;
  selectedDateKey: string | null;
}

const HistoryCalendarContext = createContext<Omit<
  HistoryCalendarDayButtonProps,
  keyof DayButtonProps
> | null>(null);

function HistoryCalendarDayButton({
  className,
  day,
  disabled,
  onClick,
  onDrag: _onDrag,
  onDragEnd: _onDragEnd,
  onDragStart: _onDragStart,
  ...props
}: DayButtonProps) {
  const context = useContext(HistoryCalendarContext);

  if (!context) {
    return (
      <button
        {...props}
        className={className}
        disabled={disabled}
        onClick={onClick}
        type="button"
      />
    );
  }

  const { historyByDate, onSelectDateKey, selectedDateKey } = context;
  const dateKey = toDateKey(day.date);
  const dayEntry = historyByDate.get(dateKey);
  const isSelected = selectedDateKey === dateKey;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.96 }}
        transition={microTransition}
        {...(dayEntry && !disabled ? { whileHover: hoverLift } : {})}
        {...(dayEntry && !disabled ? { whileTap: tapPress } : {})}
      >
        <button
          {...props}
          className={cn(
            className,
            "flex h-auto min-h-[4.9rem] w-full flex-col items-center gap-1 rounded-md border px-1 py-2 transition-colors",
            dayEntry
              ? "border-border/60 bg-background/55 hover:border-border hover:bg-background"
              : "border-transparent bg-transparent text-muted-foreground/45",
            isSelected &&
              "border-primary/60 bg-primary/8 ring-1 ring-primary/25",
            disabled && "cursor-default"
          )}
          disabled={!dayEntry || disabled}
          onClick={(event) => {
            onClick?.(event);

            if (dayEntry) {
              onSelectDateKey(dateKey);
            }
          }}
          type="button"
        >
          <span className="text-[0.68rem] font-semibold text-foreground">
            {day.date.getDate()}
          </span>
          {dayEntry ? (
            <HabitActivityRingGlyph
              categoryProgress={dayEntry.categoryProgress}
              size={34}
            />
          ) : (
            <span className="mt-1 text-[0.65rem] text-muted-foreground">-</span>
          )}
        </button>
      </m.div>
    </LazyMotion>
  );
}

export function HistoryCalendarCard({
  historyByDate,
  onSelectDateKey,
  selectedDay,
  setVisibleMonth,
  visibleMonth,
}: HistoryCalendarCardProps) {
  const calendarContextValue = useMemo(
    () => ({
      historyByDate,
      onSelectDateKey,
      selectedDateKey: selectedDay?.date ?? null,
    }),
    [historyByDate, onSelectDateKey, selectedDay?.date]
  );

  const calendarProps = {
    components: { DayButton: HistoryCalendarDayButton },
    mode: "single" as const,
    onMonthChange: setVisibleMonth,
    onSelect: (date: Date | undefined) => {
      if (!date) {
        return;
      }

      const nextDateKey = toDateKey(date);

      if (historyByDate.has(nextDateKey)) {
        onSelectDateKey(nextDateKey);
      }
    },
    showOutsideDays: true,
    ...(visibleMonth ? { month: visibleMonth } : {}),
    ...(selectedDay ? { selected: parseDateKey(selectedDay.date) } : {}),
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/60 bg-background/30 p-2">
          <HistoryCalendarContext.Provider value={calendarContextValue}>
            <Calendar {...calendarProps} />
          </HistoryCalendarContext.Provider>
        </div>
      </CardContent>
    </Card>
  );
}
