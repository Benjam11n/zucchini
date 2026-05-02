/**
 * History page Zustand store.
 *
 * Tracks the loaded history days, loading scope (recent vs full), and any
 * load errors. The `loadFullHistory` action fetches all available history
 * through the preload bridge and switches the scope to `"full"`.
 */
import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

export interface HistoryStoreState {
  history: HistoryDay[];
  historyLoadError: HabitsIpcError | null;
  historyScope: "full" | "recent";
  historySummary: HistorySummaryDay[];
  hasLoadedHistorySummary: boolean;
  isHistoryLoading: boolean;
  isHistorySummaryLoading: boolean;
  loadHistorySummary: (limit?: number) => Promise<void>;
  loadFullHistory: () => Promise<void>;
  setHistory: (history: HistoryDay[]) => void;
}

function getInitialHistoryState(): Pick<
  HistoryStoreState,
  | "history"
  | "historyLoadError"
  | "historyScope"
  | "historySummary"
  | "hasLoadedHistorySummary"
  | "isHistoryLoading"
  | "isHistorySummaryLoading"
> {
  return {
    hasLoadedHistorySummary: false,
    history: [],
    historyLoadError: null,
    historyScope: "recent",
    historySummary: [],
    isHistoryLoading: false,
    isHistorySummaryLoading: false,
  };
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  ...getInitialHistoryState(),
  loadFullHistory: async () => {
    if (get().historyScope === "full" || get().isHistoryLoading) {
      return;
    }

    await runAsyncTask(() => habitsClient.getHistory(), {
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
        set({
          history,
          historyLoadError: null,
          historyScope: "full",
          isHistoryLoading: false,
        });
      },
    });
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
  setHistory: (history) => set({ history }),
}));

export function resetHistoryStore() {
  useHistoryStore.setState(getInitialHistoryState());
}
