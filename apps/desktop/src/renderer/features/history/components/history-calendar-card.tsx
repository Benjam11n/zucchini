import type { HistoryCalendarContextValue } from "@/renderer/features/history/history.types";
import { Calendar } from "@/renderer/shared/components/ui/calendar";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import type { HistoryDay } from "@/shared/domain/history";
import { parseDateKey, toDateKey } from "@/shared/utils/date";

import {
  HistoryCalendarContext,
  HistoryCalendarDayButton,
} from "./history-calendar-context";

interface HistoryCalendarCardProps {
  historyByDate: Map<string, HistoryDay>;
  historyCalendarContextValue: HistoryCalendarContextValue;
  onSelectDateKey: (dateKey: string) => void;
  selectedDay: HistoryDay | null;
  setVisibleMonth: (date: Date | undefined) => void;
  visibleMonth: Date | undefined;
}

export function HistoryCalendarCard({
  historyByDate,
  historyCalendarContextValue,
  onSelectDateKey,
  selectedDay,
  setVisibleMonth,
  visibleMonth,
}: HistoryCalendarCardProps) {
  const calendarProps = {
    components: { DayButton: HistoryCalendarDayButton },
    mode: "single" as const,
    onMonthChange: setVisibleMonth,
    onSelect: (date: Date | undefined) => {
      if (!date) {
        return;
      }

      const nextDateKey = toDateKey(date);

      if (!historyByDate.has(nextDateKey)) {
        return;
      }

      onSelectDateKey(nextDateKey);
    },
    showOutsideDays: true,
    ...(visibleMonth ? { month: visibleMonth } : {}),
    ...(selectedDay ? { selected: parseDateKey(selectedDay.date) } : {}),
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-background/30 p-2">
          <HistoryCalendarContext.Provider value={historyCalendarContextValue}>
            <Calendar {...calendarProps} />
          </HistoryCalendarContext.Provider>
        </div>
      </CardContent>
    </Card>
  );
}
