import { LazyMotion, domAnimation, m } from "framer-motion";
import { createContext, useContext } from "react";
import type { DayButtonProps } from "react-day-picker";

import type { HistoryCalendarContextValue } from "@/renderer/features/history/history.types";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { toDateKey } from "@/shared/utils/date";

export const HistoryCalendarContext =
  createContext<HistoryCalendarContextValue | null>(null);

function useHistoryCalendarContext(): HistoryCalendarContextValue | null {
  return useContext(HistoryCalendarContext);
}

export function HistoryCalendarDayButton({
  className,
  day,
  disabled,
  onClick,
  onDrag: _onDrag,
  onDragEnd: _onDragEnd,
  onDragStart: _onDragStart,
  ...props
}: DayButtonProps) {
  const context = useHistoryCalendarContext();

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

  const { historyByDate, onSelectDate, selectedDateKey } = context;
  const dateKey = toDateKey(day.date);
  const dayEntry = historyByDate.get(dateKey);
  const isSelected = selectedDateKey === dateKey;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.96 }}
        transition={microTransition}
        whileHover={dayEntry && !disabled ? hoverLift : undefined}
        whileTap={dayEntry && !disabled ? tapPress : undefined}
      >
        <button
          {...props}
          className={cn(
            className,
            "flex h-auto min-h-[4.9rem] w-full flex-col items-center gap-1 rounded-[22px] border px-1.5 py-2 transition-colors",
            dayEntry
              ? "border-border/60 bg-background/55 hover:border-border hover:bg-background"
              : "border-transparent bg-transparent text-muted-foreground/45",
            isSelected &&
              "border-primary/60 bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]",
            disabled && "cursor-default"
          )}
          disabled={!dayEntry || disabled}
          onClick={(event) => {
            onClick?.(event);

            if (!dayEntry) {
              return;
            }

            onSelectDate(dateKey);
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
