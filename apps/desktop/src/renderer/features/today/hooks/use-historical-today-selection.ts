import { useCallback, useEffect, useMemo, useReducer } from "react";

import { habitsClient } from "@/renderer/shared/lib/habits-client";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

interface HistoricalTodaySelectionState {
  isLoading: boolean;
  selectedDate: string | null;
  selectedDay: HistoryDay | null;
}

type HistoricalTodaySelectionAction =
  | { type: "clear" }
  | { type: "select"; date: string }
  | { type: "loaded"; date: string; day: HistoryDay }
  | { type: "failed"; date: string };

function historicalTodaySelectionReducer(
  state: HistoricalTodaySelectionState,
  action: HistoricalTodaySelectionAction
): HistoricalTodaySelectionState {
  switch (action.type) {
    case "clear": {
      return {
        isLoading: false,
        selectedDate: null,
        selectedDay: null,
      };
    }
    case "select": {
      return {
        isLoading: true,
        selectedDate: action.date,
        selectedDay: null,
      };
    }
    case "loaded": {
      if (state.selectedDate !== action.date) {
        return state;
      }

      return {
        isLoading: false,
        selectedDate: action.date,
        selectedDay: action.day,
      };
    }
    case "failed": {
      if (state.selectedDate !== action.date) {
        return state;
      }

      return {
        isLoading: false,
        selectedDate: action.date,
        selectedDay: null,
      };
    }
    default: {
      return state;
    }
  }
}

export function useHistoricalTodaySelection(history: HistorySummaryDay[]) {
  const [state, dispatch] = useReducer(historicalTodaySelectionReducer, {
    isLoading: false,
    selectedDate: null,
    selectedDay: null,
  });
  const selectableDates = useMemo(
    () => new Set(history.map((day) => day.date)),
    [history]
  );
  const handleSelectDate = useCallback((date: string) => {
    dispatch({ date, type: "select" });
  }, []);
  const handleClearSelection = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  useEffect(() => {
    if (!state.selectedDate) {
      return;
    }

    if (!selectableDates.has(state.selectedDate)) {
      dispatch({ type: "clear" });
      return;
    }

    let isCurrent = true;
    const { selectedDate } = state;

    async function loadHistoricalDay() {
      try {
        const historyDay = await habitsClient.getHistoryDay(selectedDate);
        if (isCurrent) {
          dispatch({ date: selectedDate, day: historyDay, type: "loaded" });
        }
      } catch {
        if (isCurrent) {
          dispatch({ date: selectedDate, type: "failed" });
        }
      }
    }

    void loadHistoricalDay();

    return () => {
      isCurrent = false;
    };
  }, [selectableDates, state.selectedDate]);

  return {
    handleClearSelection,
    handleSelectDate,
    isLoading: state.isLoading,
    selectedDate: state.selectedDate,
    selectedDay: state.selectedDay,
  };
}
