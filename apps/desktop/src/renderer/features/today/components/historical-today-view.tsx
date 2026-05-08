import { ArrowRight, ListChecks } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

import { HabitChecklist } from "./habit-checklist";
import { LongerHabitChecklist } from "./longer-habit-checklist";

interface HistoricalTodayViewProps {
  day: HistoryDay;
  onReturnToToday: () => void;
}

export function HistoricalTodayView({
  day,
  onReturnToToday,
}: HistoricalTodayViewProps) {
  const { completedCount, dailyHabits, periodicHabits } = useMemo(() => {
    const nextDailyHabits: HabitWithStatus[] = [];
    const nextPeriodicHabits: HabitWithStatus[] = [];
    let nextCompletedCount = 0;

    for (const habit of day.habits) {
      if (isDailyHabit(habit)) {
        nextDailyHabits.push(habit);
        if (habit.completed) {
          nextCompletedCount += 1;
        }
        continue;
      }

      nextPeriodicHabits.push(habit);
    }

    return {
      completedCount: nextCompletedCount,
      dailyHabits: nextDailyHabits,
      periodicHabits: nextPeriodicHabits,
    };
  }, [day.habits]);
  const title = formatDateKey(day.date, {
    day: "numeric",
    month: "short",
    weekday: "short",
  });

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button
          onClick={onReturnToToday}
          size="sm"
          type="button"
          variant="ghost"
        >
          Today
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <HabitChecklist
        completedCount={completedCount}
        emptyMessage="No daily habits were tracked on this day."
        habits={dailyHabits}
        icon={ListChecks}
        readOnly
        title={title}
      />

      {periodicHabits.length > 0 || (day.focusQuotaGoals ?? []).length > 0 ? (
        <LongerHabitChecklist
          dateKey={day.date}
          focusQuotaGoals={day.focusQuotaGoals ?? []}
          habits={periodicHabits}
          readOnly
        />
      ) : null}
    </div>
  );
}
