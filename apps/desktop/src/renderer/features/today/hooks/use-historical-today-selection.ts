import { useCallback, useEffect, useMemo, useState } from "react";

import { useHistoryDayDetail } from "@/renderer/features/history/hooks/use-history-day-detail";
import type { HistorySummaryDay } from "@/shared/domain/history";

export function useHistoricalTodaySelection(history: HistorySummaryDay[]) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectableDates = useMemo(
    () => new Set(history.map((day) => day.date)),
    [history]
  );
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);
  const handleClearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);
  const { isLoading, selectedDay } = useHistoryDayDetail(selectedDate, history);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    if (!selectableDates.has(selectedDate)) {
      setSelectedDate(null);
    }
  }, [selectableDates, selectedDate]);

  return {
    handleClearSelection,
    handleSelectDate,
    isLoading,
    selectedDate,
    selectedDay,
  };
}
