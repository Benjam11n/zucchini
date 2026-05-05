/**
 * History page Zustand store.
 *
 * Tracks history years, the selected year's loaded days, and lightweight recent
 * history used by Today. Year data is cached per year so the renderer never
 * needs to mirror the entire history table.
 */
import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

type HistoryByYear = Record<number, HistoryDay[] | undefined>;

interface HistoryStoreState {
  history: HistoryDay[];
  historyByYear: HistoryByYear;
  historyLoadError: HabitsIpcError | null;
  historySummary: HistorySummaryDay[];
  historyYears: number[];
  hasLoadedHistorySummary: boolean;
  isHistoryLoading: boolean;
  isHistorySummaryLoading: boolean;
  selectedHistoryYear: number | null;
  loadHistoryYear: (
    year: number,
    options?: { force?: boolean }
  ) => Promise<void>;
  loadHistoryYears: (options?: { force?: boolean }) => Promise<void>;
  loadHistorySummary: (limit?: number) => Promise<void>;
  selectHistoryYear: (year: number) => Promise<void>;
}

function getInitialHistoryState(): Pick<
  HistoryStoreState,
  | "history"
  | "historyByYear"
  | "historyLoadError"
  | "historySummary"
  | "historyYears"
  | "hasLoadedHistorySummary"
  | "isHistoryLoading"
  | "isHistorySummaryLoading"
  | "selectedHistoryYear"
> {
  return {
    hasLoadedHistorySummary: false,
    history: [],
    historyByYear: {},
    historyLoadError: null,
    historySummary: [],
    historyYears: [],
    isHistoryLoading: false,
    isHistorySummaryLoading: false,
    selectedHistoryYear: null,
  };
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  ...getInitialHistoryState(),
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
    if (
      !options.force &&
      (get().historyByYear[year] || get().isHistoryLoading)
    ) {
      const cachedHistory = get().historyByYear[year];
      if (cachedHistory && get().selectedHistoryYear === year) {
        set({ history: cachedHistory });
      }
      return;
    }

    await runAsyncTask(() => habitsClient.getHistoryForYear(year), {
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
          historyByYear: {
            ...state.historyByYear,
            [year]: history,
          },
          historyLoadError: null,
          isHistoryLoading: false,
          selectedHistoryYear: state.selectedHistoryYear ?? year,
        }));
      },
    });
  },
  loadHistoryYears: async (options = {}) => {
    if (!options.force && get().historyYears.length > 0) {
      const selectedYear = get().selectedHistoryYear ?? get().historyYears[0];
      if (selectedYear !== undefined) {
        await get().loadHistoryYear(selectedYear);
      }
      return;
    }

    await runAsyncTask(() => habitsClient.getHistoryYears(), {
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
          await get().loadHistoryYear(
            selectedHistoryYear,
            options.force === undefined ? {} : { force: options.force }
          );
        }
      },
    });
  },
  selectHistoryYear: async (year) => {
    set({
      history: get().historyByYear[year] ?? [],
      selectedHistoryYear: year,
    });
    await get().loadHistoryYear(year);
  },
}));
