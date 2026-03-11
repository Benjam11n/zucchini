import { create } from "zustand";

import type { HistoryStoreState } from "@/renderer/app/state/types";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";

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

    set({
      historyLoadError: null,
      isHistoryLoading: true,
    });

    try {
      const history = await window.habits.getHistory();
      set({
        history,
        historyLoadError: null,
        historyScope: "full",
        isHistoryLoading: false,
      });
    } catch (error) {
      set({
        historyLoadError: toHabitsIpcError(error),
        isHistoryLoading: false,
      });
    }
  },
  setHistory: (history) => set({ history }),
}));

export function resetHistoryStore() {
  useHistoryStore.setState(getInitialHistoryState());
}
