/**
 * History page view state hook.
 *
 * Manages calendar navigation (selected date, year), computes history stats
 * (total days, completion rate), builds the day lookup map, and provides
 * callbacks for selecting dates and navigating between years.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  HistoryCalendarContextValue,
  HistoryPageProps,
} from "@/renderer/features/history/history.types";
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
  todayDate: string
): HistoryViewState {
  const fallbackDate = history[0]?.date ?? todayDate;
  const fallbackYear = Number.parseInt(fallbackDate.slice(0, 4), 10);

  return {
    selectedDateKey: fallbackDate,
    selectedYear: fallbackYear,
    visibleMonth: parseDateKey(fallbackDate),
  };
}

export function useHistoryViewState({
  history,
  todayDate,
}: Pick<HistoryPageProps, "history" | "todayDate">) {
  const [viewState, setViewState] = useState<HistoryViewState>(() =>
    createInitialHistoryViewState(history, todayDate)
  );

  const availableYears = useMemo(
    () =>
      [
        ...new Set(
          history.map((day) => Number.parseInt(day.date.slice(0, 4), 10))
        ),
      ]
        .filter((year) => !Number.isNaN(year))
        .toSorted((left, right) => right - left),
    [history]
  );

  const filteredHistory = useMemo(
    () =>
      history.filter(
        (day) =>
          Number.parseInt(day.date.slice(0, 4), 10) === viewState.selectedYear
      ),
    [history, viewState.selectedYear]
  );

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
    const selectedYearStillExists = availableYears.includes(
      viewState.selectedYear
    );
    const nextSelectedYear = selectedYearStillExists
      ? viewState.selectedYear
      : (availableYears[0] ?? Number.parseInt(todayDate.slice(0, 4), 10));
    const nextHistory = history.filter(
      (day) => Number.parseInt(day.date.slice(0, 4), 10) === nextSelectedYear
    );
    const fallbackDate = nextHistory[0]?.date ?? null;

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
        nextHistory.some((day) => day.date === current.selectedDateKey)
          ? current.selectedDateKey
          : fallbackDate,
      selectedYear: nextSelectedYear,
      visibleMonth:
        current.visibleMonth &&
        current.visibleMonth.getFullYear() === nextSelectedYear
          ? current.visibleMonth
          : parseDateKey(fallbackDate),
    }));
  }, [availableYears, history, todayDate, viewState.selectedYear]);

  const onSelectDate = useCallback((dateKey: string) => {
    setViewState({
      selectedDateKey: dateKey,
      selectedYear: Number.parseInt(dateKey.slice(0, 4), 10),
      visibleMonth: parseDateKey(dateKey),
    });
  }, []);

  const historyCalendarContextValue: HistoryCalendarContextValue = useMemo(
    () => ({
      historyByDate,
      onSelectDate,
      selectedDateKey: selectedDay?.date ?? null,
    }),
    [historyByDate, onSelectDate, selectedDay?.date]
  );

  return {
    availableYears,
    filteredHistory,
    historyByDate,
    historyCalendarContextValue,
    selectedDay,
    setViewState,
    stats,
    viewState,
  };
}
