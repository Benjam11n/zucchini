/**
 * History page Zustand store.
 *
 * Tracks the loaded history days, loading scope (recent vs full), and any
 * load errors. The `loadFullHistory` action fetches all available history
 * through the preload bridge and switches the scope to `"full"`.
 */
import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";

export interface HistoryStoreState {
  history: HistoryDay[];
  historyLoadError: HabitsIpcError | null;
  historyScope: "full" | "recent";
  isHistoryLoading: boolean;
  loadFullHistory: () => Promise<void>;
  setHistory: (history: HistoryDay[]) => void;
}

function getInitialHistoryState(): Pick<
  HistoryStoreState,
  "history" | "historyLoadError" | "historyScope" | "isHistoryLoading"
> {
  return {
    history: [],
    historyLoadError: null,
    historyScope: "recent",
    isHistoryLoading: false,
  };
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  ...getInitialHistoryState(),
  loadFullHistory: async () => {
    if (get().historyScope === "full" || get().isHistoryLoading) {
      return;
    }

    await runAsyncTask(() => window.habits.getHistory(), {
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
  setHistory: (history) => set({ history }),
}));

export function resetHistoryStore() {
  useHistoryStore.setState(getInitialHistoryState());
}
