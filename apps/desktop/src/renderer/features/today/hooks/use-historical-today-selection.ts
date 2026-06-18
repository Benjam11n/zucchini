import { useCallback, useEffect, useMemo, useState } from "react";

import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

interface UseHistoricalTodaySelectionInput {
  history: HistorySummaryDay[];
  historyDayByDate: Record<string, HistoryDay | undefined>;
  isHistoryDayLoading: boolean;
  loadHistoryDay: (date: string) => void;
  loadingHistoryDayKey: string | null;
}

export function useHistoricalTodaySelection({
  history,
  historyDayByDate,
  isHistoryDayLoading,
  loadHistoryDay,
  loadingHistoryDayKey,
}: UseHistoricalTodaySelectionInput) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectableDates = useMemo(
    () => new Set(history.map((day) => day.date)),
    [history]
  );
  const activeSelectedDate =
    selectedDate && selectableDates.has(selectedDate) ? selectedDate : null;
  const selectedDay = activeSelectedDate
    ? (historyDayByDate[activeSelectedDate] ?? null)
    : null;
  const handleSelectDate = useCallback(
    (date: string) => {
      setSelectedDate(date);
      if (!historyDayByDate[date]) {
        void loadHistoryDay(date);
      }
    },
    [historyDayByDate, loadHistoryDay]
  );
  const handleClearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);

  useEffect(() => {
    if (selectedDate && !selectableDates.has(selectedDate)) {
      setSelectedDate(null);
    }
  }, [selectableDates, selectedDate]);

  return {
    handleClearSelection,
    handleSelectDate,
    isLoading:
      activeSelectedDate !== null &&
      isHistoryDayLoading &&
      loadingHistoryDayKey === activeSelectedDate,
    selectedDate: activeSelectedDate,
    selectedDay,
  };
}
