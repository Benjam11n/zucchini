import { useEffect, useMemo } from "react";

import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import type { HistorySummaryDay } from "@/shared/domain/history";

export function useHistoryDayDetail(
  selectedDate: string | null,
  selectableHistory: HistorySummaryDay[]
) {
  const historyDayByDate = useHistoryStore((state) => state.historyDayByDate);
  const loadHistoryDay = useHistoryStore((state) => state.loadHistoryDay);
  const selectableDates = useMemo(
    () => new Set(selectableHistory.map((day) => day.date)),
    [selectableHistory]
  );
  const selectedDay = selectedDate
    ? (historyDayByDate[selectedDate] ?? null)
    : null;

  useEffect(() => {
    if (!selectedDate || !selectableDates.has(selectedDate) || selectedDay) {
      return;
    }

    void loadHistoryDay(selectedDate);
  }, [loadHistoryDay, selectableDates, selectedDate, selectedDay]);

  return {
    isLoading: selectedDate !== null && selectedDay === null,
    selectedDay,
  };
}
