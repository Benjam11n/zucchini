import { useCallback, useEffect, useMemo, useState } from "react";

import { habitsClient } from "@/renderer/shared/lib/habits-client";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

export function useHistoricalTodaySelection(history: HistorySummaryDay[]) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [historyDayByDate, setHistoryDayByDate] = useState<
    Record<string, HistoryDay | undefined>
  >({});
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
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

    let isCurrent = true;
    const dateToLoad = selectedDate;
    setLoadingDate(dateToLoad);

    async function loadSelectedHistoryDay() {
      try {
        const historyDay = await habitsClient.getHistoryDay(dateToLoad);

        if (!isCurrent) {
          return;
        }

        setHistoryDayByDate((current) => ({
          ...current,
          [dateToLoad]: historyDay,
        }));
      } finally {
        if (isCurrent) {
          setLoadingDate(null);
        }
      }
    }

    void loadSelectedHistoryDay();

    return () => {
      isCurrent = false;
    };
  }, [selectableDates, selectedDate, selectedDay]);

  return {
    handleClearSelection,
    handleSelectDate,
    isLoading: selectedDate !== null && loadingDate === selectedDate,
    selectedDate,
    selectedDay,
  };
}
