/**
 * History page view state hook.
 *
 * Manages selected year/date state and derives the year timeline plus the
 * selected month's sidebar metrics.
 */
import { useEffect, useMemo, useState } from "react";

import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import {
  getHistoryMonthDays,
  getHistoryMonthStats,
  getHistoryTrendPoints,
} from "@/renderer/features/history/lib/history-timeline";
import { getHistoryDayLookup } from "@/renderer/shared/lib/history-summary";
import { parseDateKey } from "@/shared/utils/date";

interface HistoryViewState {
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

  const filteredHistory = useMemo(
    () =>
      history.filter((day) =>
        day.date.startsWith(`${viewState.selectedYear}-`)
      ),
    [history, viewState.selectedYear]
  );
  const historyByDate = useMemo(
    () => getHistoryDayLookup(filteredHistory),
    [filteredHistory]
  );
  const selectedMonthDays = useMemo(
    () => getHistoryMonthDays(filteredHistory, viewState.selectedDateKey),
    [filteredHistory, viewState.selectedDateKey]
  );
  const monthStats = useMemo(
    () => getHistoryMonthStats(selectedMonthDays),
    [selectedMonthDays]
  );
  const trendPoints = useMemo(
    () => getHistoryTrendPoints(selectedMonthDays),
    [selectedMonthDays]
  );
  const selectedDay =
    (viewState.selectedDateKey
      ? historyByDate.get(viewState.selectedDateKey)
      : null) ??
    filteredHistory[0] ??
    null;
  const sortedDates = useMemo(
    () => filteredHistory.map((day) => day.date).toSorted(),
    [filteredHistory]
  );
  const selectedDateIndex = viewState.selectedDateKey
    ? sortedDates.indexOf(viewState.selectedDateKey)
    : -1;
  const previousDateKey =
    selectedDateIndex > 0 ? (sortedDates[selectedDateIndex - 1] ?? null) : null;
  const nextDateKey =
    selectedDateIndex >= 0 && selectedDateIndex < sortedDates.length - 1
      ? (sortedDates[selectedDateIndex + 1] ?? null)
      : null;
  const selectDateKey = (dateKey: string) => {
    if (!historyByDate.has(dateKey)) {
      return;
    }

    setViewState((current) => ({
      ...current,
      selectedDateKey: dateKey,
      selectedYear: Number.parseInt(dateKey.slice(0, 4), 10),
      visibleMonth: parseDateKey(dateKey),
    }));
  };

  useEffect(() => {
    const desiredSelectedYear = selectedHistoryYear ?? viewState.selectedYear;
    const selectedYearStillExists =
      availableYears.includes(desiredSelectedYear);
    const nextSelectedYear = selectedYearStillExists
      ? desiredSelectedYear
      : (availableYears[0] ?? Number.parseInt(todayDate.slice(0, 4), 10));
    const nextYearHistory = history.filter((day) =>
      day.date.startsWith(`${nextSelectedYear}-`)
    );
    const fallbackDate = nextYearHistory[0]?.date ?? null;

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
        nextYearHistory.some((day) => day.date === current.selectedDateKey)
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
    monthStats,
    nextDateKey,
    previousDateKey,
    selectDateKey,
    selectedDay,
    setViewState,
    trendPoints,
    viewState,
  };
}

export type HistoryViewModel = ReturnType<typeof useHistoryViewState>;
