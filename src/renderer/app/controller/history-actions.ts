import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";

export function createHistoryActions() {
  return {
    dismissWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
    },
    async loadFullHistory() {
      await useHistoryStore.getState().loadFullHistory();
    },
    async loadWeeklyReviewOverview() {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    },
    openWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
    },
    async selectWeeklyReview(weekStart: string) {
      await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
    },
  };
}
