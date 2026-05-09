/**
 * History page Zustand store.
 *
 * Tracks history years, selected year summaries, selected day details, and
 * lightweight recent history used by Today.
 */
import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import { getDateKeyMonth } from "@/shared/utils/date";

type HistorySummaryByYear = Record<number, HistorySummaryDay[] | undefined>;
type HistoryDayByDate = Record<string, HistoryDay | undefined>;
type HistorySummaryByMonth = Record<string, HistorySummaryDay[] | undefined>;

let historyYearsRequest: Promise<unknown> | null = null;
const historyYearRequests = new Map<number, Promise<unknown>>();
const historyMonthRequests = new Map<string, Promise<unknown>>();

function getHistoryMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

interface HistoryStoreState {
  contributionHistory: HistorySummaryDay[];
  history: HistorySummaryDay[];
  historyDayByDate: HistoryDayByDate;
  historyLoadError: HabitsIpcError | null;
  historySummary: HistorySummaryDay[];
  historySummaryByMonth: HistorySummaryByMonth;
  historySummaryByYear: HistorySummaryByYear;
  historyYears: number[];
  hasLoadedHistorySummary: boolean;
  isHistoryDayLoading: boolean;
  isHistoryLoading: boolean;
  isHistoryContributionLoading: boolean;
  isHistorySummaryLoading: boolean;
  loadingHistoryDayKey: string | null;
  selectedHistoryYear: number | null;
  cacheHistoryDay: (day: HistoryDay) => void;
  loadHistoryDay: (
    date: string,
    options?: { force?: boolean }
  ) => Promise<void>;
  loadHistoryYear: (
    year: number,
    options?: { force?: boolean }
  ) => Promise<void>;
  loadHistoryMonth: (
    year: number,
    month: number,
    options?: { force?: boolean }
  ) => Promise<void>;
  loadHistoryYears: (options?: {
    force?: boolean;
    initialMonth?: number;
  }) => Promise<void>;
  loadHistorySummary: (limit?: number) => Promise<void>;
}

function getInitialHistoryState(): Pick<
  HistoryStoreState,
  | "history"
  | "contributionHistory"
  | "historyDayByDate"
  | "historyLoadError"
  | "historySummary"
  | "historySummaryByMonth"
  | "historySummaryByYear"
  | "historyYears"
  | "hasLoadedHistorySummary"
  | "isHistoryDayLoading"
  | "isHistoryLoading"
  | "isHistoryContributionLoading"
  | "isHistorySummaryLoading"
  | "loadingHistoryDayKey"
  | "selectedHistoryYear"
> {
  return {
    contributionHistory: [],
    hasLoadedHistorySummary: false,
    history: [],
    historyDayByDate: {},
    historyLoadError: null,
    historySummary: [],
    historySummaryByMonth: {},
    historySummaryByYear: {},
    historyYears: [],
    isHistoryContributionLoading: false,
    isHistoryDayLoading: false,
    isHistoryLoading: false,
    isHistorySummaryLoading: false,
    loadingHistoryDayKey: null,
    selectedHistoryYear: null,
  };
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  ...getInitialHistoryState(),
  cacheHistoryDay: (day) => {
    set((state) => ({
      historyDayByDate: {
        ...state.historyDayByDate,
        [day.date]: day,
      },
    }));
  },
  loadHistoryDay: async (date, options = {}) => {
    if (!options.force && get().historyDayByDate[date]) {
      return;
    }

    await runAsyncTask(() => habitsClient.getHistoryDay(date), {
      mapError: toHabitsIpcError,
      onError: (historyLoadError) => {
        set({
          historyLoadError,
          isHistoryDayLoading: false,
          loadingHistoryDayKey: null,
        });
      },
      onStart: () => {
        set({
          historyLoadError: null,
          isHistoryDayLoading: true,
          loadingHistoryDayKey: date,
        });
      },
      onSuccess: (historyDay) => {
        set((state) => ({
          historyDayByDate: {
            ...state.historyDayByDate,
            [date]: historyDay,
          },
          historyLoadError: null,
          isHistoryDayLoading: false,
          loadingHistoryDayKey: null,
        }));
      },
    });
  },
  loadHistoryMonth: async (year, month, options = {}) => {
    const monthKey = getHistoryMonthKey(year, month);
    const cachedHistory = get().historySummaryByMonth[monthKey];
    if (!options.force && cachedHistory) {
      set({
        history: cachedHistory,
        selectedHistoryYear: year,
      });
      return;
    }

    const currentMonthRequest = historyMonthRequests.get(monthKey);
    if (!options.force && currentMonthRequest) {
      await currentMonthRequest;
      return;
    }

    const historyMonthRequest = runAsyncTask(
      () => habitsClient.getHistorySummaryForMonth(year, month),
      {
        mapError: toHabitsIpcError,
        onError: (historyLoadError) => {
          set({
            historyLoadError,
            isHistoryLoading: false,
          });
        },
        onStart: () => {
          set({
            historyLoadError: null,
            isHistoryLoading: true,
          });
        },
        onSuccess: (history) => {
          set((state) => ({
            history:
              state.selectedHistoryYear === year ||
              state.selectedHistoryYear === null
                ? history
                : state.history,
            historyLoadError: null,
            historySummaryByMonth: {
              ...state.historySummaryByMonth,
              [monthKey]: history,
            },
            isHistoryLoading: false,
            selectedHistoryYear: state.selectedHistoryYear ?? year,
          }));
        },
      }
    );

    historyMonthRequests.set(monthKey, historyMonthRequest);

    try {
      await historyMonthRequest;
    } finally {
      if (historyMonthRequests.get(monthKey) === historyMonthRequest) {
        historyMonthRequests.delete(monthKey);
      }
    }
  },
  loadHistorySummary: async (limit = 14) => {
    if (get().isHistorySummaryLoading) {
      return;
    }

    await runAsyncTask(() => habitsClient.getHistorySummary(limit), {
      mapError: toHabitsIpcError,
      onError: (historyLoadError) => {
        set({
          hasLoadedHistorySummary: true,
          historyLoadError,
          isHistorySummaryLoading: false,
        });
      },
      onStart: () => {
        set({
          historyLoadError: null,
          isHistorySummaryLoading: true,
        });
      },
      onSuccess: (historySummary) => {
        set({
          hasLoadedHistorySummary: true,
          historyLoadError: null,
          historySummary,
          isHistorySummaryLoading: false,
        });
      },
    });
  },
  loadHistoryYear: async (year, options = {}) => {
    const cachedHistory = get().historySummaryByYear[year];
    if (!options.force && cachedHistory) {
      set((state) => ({
        contributionHistory:
          state.selectedHistoryYear === year ||
          state.selectedHistoryYear === null
            ? cachedHistory
            : state.contributionHistory,
      }));
      return;
    }

    const currentYearRequest = historyYearRequests.get(year);
    if (!options.force && currentYearRequest) {
      await currentYearRequest;
      return;
    }

    const historyYearRequest = runAsyncTask(
      () => habitsClient.getHistorySummaryForYear(year),
      {
        mapError: toHabitsIpcError,
        onError: (historyLoadError) => {
          set({
            historyLoadError,
            isHistoryContributionLoading: false,
          });
        },
        onStart: () => {
          set({
            historyLoadError: null,
            isHistoryContributionLoading: true,
          });
        },
        onSuccess: (history) => {
          set((state) => ({
            contributionHistory:
              state.selectedHistoryYear === year
                ? history
                : state.contributionHistory,
            historyLoadError: null,
            historySummaryByYear: {
              ...state.historySummaryByYear,
              [year]: history,
            },
            isHistoryContributionLoading: false,
            selectedHistoryYear: state.selectedHistoryYear ?? year,
          }));
        },
      }
    );

    historyYearRequests.set(year, historyYearRequest);

    try {
      await historyYearRequest;
    } finally {
      if (historyYearRequests.get(year) === historyYearRequest) {
        historyYearRequests.delete(year);
      }
    }
  },
  loadHistoryYears: async (options = {}) => {
    if (!options.force && historyYearsRequest) {
      await historyYearsRequest;
      return;
    }

    if (!options.force && get().historyYears.length > 0) {
      const selectedYear = get().selectedHistoryYear ?? get().historyYears[0];
      if (selectedYear !== undefined) {
        const [currentHistoryDay] = get().history;
        const selectedMonth = currentHistoryDay
          ? getDateKeyMonth(currentHistoryDay.date)
          : (options.initialMonth ??
            getDateKeyMonth(new Date().toISOString().slice(0, 10)));
        void get().loadHistoryYear(selectedYear);
        await get().loadHistoryMonth(selectedYear, selectedMonth);
      }
      return;
    }

    const nextHistoryYearsRequest = runAsyncTask(
      () => habitsClient.getHistoryYears(),
      {
        mapError: toHabitsIpcError,
        onError: (historyLoadError) => {
          set({
            historyLoadError,
            isHistoryLoading: false,
          });
        },
        onStart: () => {
          set({
            historyLoadError: null,
            isHistoryLoading: true,
          });
        },
        onSuccess: async (historyYears) => {
          const currentSelectedYear = get().selectedHistoryYear;
          const selectedHistoryYear =
            currentSelectedYear && historyYears.includes(currentSelectedYear)
              ? currentSelectedYear
              : (historyYears[0] ?? null);

          set({
            historyLoadError: null,
            historyYears,
            isHistoryLoading: false,
            selectedHistoryYear,
          });

          if (selectedHistoryYear !== null) {
            void get().loadHistoryYear(selectedHistoryYear, options);
            const todayMonth =
              options.initialMonth ??
              getDateKeyMonth(
                get().historySummary[0]?.date ??
                  new Date().toISOString().slice(0, 10)
              );
            await get().loadHistoryMonth(
              selectedHistoryYear,
              todayMonth,
              options.force === undefined ? {} : { force: options.force }
            );
          }
        },
      }
    );

    historyYearsRequest = nextHistoryYearsRequest;

    try {
      await nextHistoryYearsRequest;
    } finally {
      if (historyYearsRequest === nextHistoryYearsRequest) {
        historyYearsRequest = null;
      }
    }
  },
}));
