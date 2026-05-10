import { useInsightsStore } from "@/renderer/features/insights/state/insights-store";

export function createInsightsActions() {
  return {
    async loadInsightsDashboard(force = false) {
      await useInsightsStore.getState().loadDashboard({ force });
    },
    resetInsightsDashboard() {
      useInsightsStore.getState().resetDashboard();
    },
  };
}
