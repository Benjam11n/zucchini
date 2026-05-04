/**
 * History page view state hook.
 *
 * Manages calendar navigation (selected date, year), computes history stats
 * (total days, completion rate), builds the day lookup map, and provides
 * callbacks for selecting dates and navigating between years.
 */
import { useEffect, useMemo, useState } from "react";

import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import {
  getHistoryDayLookup,
  getHistoryStats,
} from "@/renderer/features/history/lib/history-summary";
import { parseDateKey } from "@/shared/utils/date";

export interface HistoryViewState {
  selectedDateKey: string | null;
  selectedYear: number;
  visibleMonth: Date | undefined;
}

function createInitialHistoryViewState(
  history: HistoryPageProps["history"],
  selectedHistoryYear: number | null,
  todayDate: string
): HistoryViewState {
  const fallbackDate = history[0]?.date ?? todayDate;
  const fallbackYear =
    selectedHistoryYear ?? Number.parseInt(fallbackDate.slice(0, 4), 10);

  return {
    selectedDateKey: fallbackDate,
    selectedYear: fallbackYear,
    visibleMonth: parseDateKey(fallbackDate),
  };
}

export function useHistoryViewState({
  history,
  historyYears,
  selectedHistoryYear,
  todayDate,
}: Pick<
  HistoryPageProps,
  "history" | "historyYears" | "selectedHistoryYear" | "todayDate"
>) {
  const [viewState, setViewState] = useState<HistoryViewState>(() =>
    createInitialHistoryViewState(history, selectedHistoryYear, todayDate)
  );

  const availableYears = useMemo(
    () =>
      historyYears.length > 0
        ? historyYears
        : [selectedHistoryYear ?? Number.parseInt(todayDate.slice(0, 4), 10)],
    [historyYears, selectedHistoryYear, todayDate]
  );

  const filteredHistory = history;

  const stats = useMemo(
    () => getHistoryStats(filteredHistory),
    [filteredHistory]
  );
  const historyByDate = useMemo(
    () => getHistoryDayLookup(filteredHistory),
    [filteredHistory]
  );
  const selectedDay =
    (viewState.selectedDateKey
      ? historyByDate.get(viewState.selectedDateKey)
      : null) ??
    filteredHistory[0] ??
    null;

  useEffect(() => {
    const desiredSelectedYear = selectedHistoryYear ?? viewState.selectedYear;
    const selectedYearStillExists =
      availableYears.includes(desiredSelectedYear);
    const nextSelectedYear = selectedYearStillExists
      ? desiredSelectedYear
      : (availableYears[0] ?? Number.parseInt(todayDate.slice(0, 4), 10));
    const fallbackDate = history[0]?.date ?? null;

    if (!fallbackDate) {
      setViewState({
        selectedDateKey: null,
        selectedYear: nextSelectedYear,
        visibleMonth: undefined,
      });
      return;
    }

    setViewState((current) => ({
      selectedDateKey:
        current.selectedDateKey &&
        history.some((day) => day.date === current.selectedDateKey)
          ? current.selectedDateKey
          : fallbackDate,
      selectedYear: nextSelectedYear,
      visibleMonth:
        current.visibleMonth &&
        current.visibleMonth.getFullYear() === nextSelectedYear
          ? current.visibleMonth
          : parseDateKey(fallbackDate),
    }));
  }, [
    availableYears,
    history,
    selectedHistoryYear,
    todayDate,
    viewState.selectedYear,
  ]);

  return {
    availableYears,
    filteredHistory,
    historyByDate,
    selectedDay,
    setViewState,
    stats,
    viewState,
  };
}
