import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";

import type { HistoryDay } from "@/shared/domain/history";

export type HistoryCollectionDay = HistoryDay & {
  year: number;
};

function toHistoryCollectionDay(day: HistoryDay): HistoryCollectionDay {
  return {
    ...day,
    year: Number.parseInt(day.date.slice(0, 4), 10),
  };
}

export const historyDayCollection = createCollection(
  localOnlyCollectionOptions<HistoryCollectionDay, string>({
    getKey: (day) => day.date,
    id: "history-days",
  })
);

export function syncHistoryCollections(history: HistoryDay[] | null): void {
  const currentDates = [...historyDayCollection.state.keys()];
  if (currentDates.length > 0) {
    historyDayCollection.delete(currentDates);
  }

  if ((history?.length ?? 0) > 0) {
    historyDayCollection.insert(history?.map(toHistoryCollectionDay) ?? []);
  }
}
