import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";

import type { TodayState } from "@/shared/contracts/today-state";
import type { HabitWithStatus } from "@/shared/domain/habit";

export const todayHabitCollection = createCollection(
  localOnlyCollectionOptions<HabitWithStatus, number>({
    getKey: (habit) => habit.id,
    id: "today-habits",
  })
);

export function syncTodayCollections(todayState: TodayState | null): void {
  const currentIds = [...todayHabitCollection.state.keys()];
  if (currentIds.length > 0) {
    todayHabitCollection.delete(currentIds);
  }

  if ((todayState?.habits.length ?? 0) > 0) {
    todayHabitCollection.insert(todayState?.habits ?? []);
  }
}

export function patchTodayHabitCollection(habit: HabitWithStatus): void {
  if (todayHabitCollection.has(habit.id)) {
    todayHabitCollection.update(habit.id, (draft) => {
      Object.assign(draft, habit);
    });
    return;
  }

  todayHabitCollection.insert(habit);
}

export function getTodayHabitFromCollection(
  habitId: number
): HabitWithStatus | undefined {
  return todayHabitCollection.state.get(habitId);
}
