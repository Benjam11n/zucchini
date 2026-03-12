import { create } from "zustand";

import type { TodayState } from "@/shared/contracts/habits-ipc";

export interface TodayStoreState {
  todayState: TodayState | null;
  setTodayState: (todayState: TodayState | null) => void;
}

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
