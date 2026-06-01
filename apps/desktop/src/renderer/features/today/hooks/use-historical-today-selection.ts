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
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);
  const handleClearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);
  const selectedDay = selectedDate
    ? (historyDayByDate[selectedDate] ?? null)
    : null;

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    if (!selectableDates.has(selectedDate)) {
      setSelectedDate(null);
    }
  }, [selectableDates, selectedDate]);

  useEffect(() => {
    if (!selectedDate || !selectableDates.has(selectedDate) || selectedDay) {
      return;
    }

    void loadHistoryDay(selectedDate);
  }, [loadHistoryDay, selectableDates, selectedDate, selectedDay]);

  return {
    handleClearSelection,
    handleSelectDate,
    isLoading:
      selectedDate !== null &&
      isHistoryDayLoading &&
      loadingHistoryDayKey === selectedDate,
    selectedDate,
    selectedDay,
  };
}
