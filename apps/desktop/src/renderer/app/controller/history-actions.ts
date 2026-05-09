import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";

function getTodayMonth(): number | undefined {
  const todayDate = useTodayStore.getState().todayState?.date;
  return todayDate ? Number.parseInt(todayDate.slice(5, 7), 10) : undefined;
}

export function createHistoryActions() {
  return {
    dismissWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
    },
    async loadHistoryMonth(year: number, month: number) {
      await useHistoryStore.getState().loadHistoryMonth(year, month);
    },
    async loadHistorySummary(limit?: number) {
      await useHistoryStore.getState().loadHistorySummary(limit);
    },
    async loadHistoryYears() {
      const initialMonth = getTodayMonth();
      await useHistoryStore
        .getState()
        .loadHistoryYears(initialMonth ? { initialMonth } : {});
    },
    async loadWeeklyReviewOverview() {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    },
    openWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
    },
    async selectHistoryMonth(year: number, month: number) {
      useHistoryStore.setState({ selectedHistoryYear: year });
      await useHistoryStore.getState().loadHistoryMonth(year, month);
      void useHistoryStore.getState().loadHistoryYear(year);
    },
    async selectWeeklyReview(weekStart: string) {
      await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
    },
  };
}
