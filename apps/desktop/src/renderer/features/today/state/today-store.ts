import { create } from "zustand";

import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { Habit } from "@/shared/domain/habit";

export interface TodayStoreState {
  managedHabits: Habit[];
  todayState: TodayState | null;
  setManagedHabits: (managedHabits: Habit[]) => void;
  setTodayState: (todayState: TodayState | null) => void;
}

function getInitialTodayState(): Pick<
  TodayStoreState,
  "managedHabits" | "todayState"
> {
  return {
    managedHabits: [],
    todayState: null,
  };
}

export const useTodayStore = create<TodayStoreState>()((set) => ({
  ...getInitialTodayState(),
  setManagedHabits: (managedHabits) => set({ managedHabits }),
  setTodayState: (todayState) => set({ todayState }),
}));

export function resetTodayStore() {
  useTodayStore.setState(getInitialTodayState());
}
