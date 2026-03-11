import { create } from "zustand";

import type { TodayStoreState } from "./types";

function getInitialTodayState(): Pick<TodayStoreState, "todayState"> {
  return {
    todayState: null,
  };
}

export const useTodayStore = create<TodayStoreState>()((set) => ({
  ...getInitialTodayState(),
  setTodayState: (todayState) => set({ todayState }),
}));

export function resetTodayStore() {
  useTodayStore.setState(getInitialTodayState());
}
