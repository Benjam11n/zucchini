import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";

export function createHistoryActions() {
  return {
    dismissWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
    },
    async loadHistorySummary(limit?: number) {
      await useHistoryStore.getState().loadHistorySummary(limit);
    },
    async loadHistoryYears() {
      await useHistoryStore.getState().loadHistoryYears();
    },
    async loadWeeklyReviewOverview() {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    },
    openWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
    },
    async selectHistoryYear(year: number) {
      await useHistoryStore.getState().selectHistoryYear(year);
    },
    async selectWeeklyReview(weekStart: string) {
      await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
    },
  };
}
