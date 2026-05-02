/**
 * Today page Zustand store.
 *
 * Holds the current `TodayState` (today's habit checklist, streak, settings)
 * and the full list of managed habits (including archived). Updated by today
 * action creators after IPC calls succeed.
 */
import { create } from "zustand";

import type { TodayState } from "@/shared/contracts/today-state";
import type { Habit } from "@/shared/domain/habit";

interface TodayStoreState {
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
