import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryDay } from "@/shared/domain/history";
import { parseDateKey, toDateKey } from "@/shared/utils/date";

import {
  HistoryCalendarContext,
  HistoryCalendarDayButton,
} from "./history-calendar-context";
import type { HistoryCalendarContextValue } from "./types";

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
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="rounded-[28px] border border-border/60 bg-background/30 p-2">
          <HistoryCalendarContext.Provider value={historyCalendarContextValue}>
            <Calendar
              components={{ DayButton: HistoryCalendarDayButton }}
              mode="single"
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(date) => {
                if (!date) {
                  return;
                }

                const nextDateKey = toDateKey(date);

                if (!historyByDate.has(nextDateKey)) {
                  return;
                }

                onSelectDateKey(nextDateKey);
              }}
              selected={
                selectedDay ? parseDateKey(selectedDay.date) : undefined
              }
              showOutsideDays
            />
          </HistoryCalendarContext.Provider>
        </div>
      </CardContent>
    </Card>
  );
}
