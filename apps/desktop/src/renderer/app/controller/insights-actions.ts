import { useInsightsStore } from "@/renderer/features/insights/state/insights-store";
import type { InsightsRangeDays } from "@/shared/domain/insights";

export function createInsightsActions() {
  return {
    async handleSelectInsightsRangeDays(rangeDays: InsightsRangeDays) {
      await useInsightsStore.getState().setRangeDays(rangeDays);
    },
    async loadInsightsDashboard(force = false) {
      await useInsightsStore.getState().loadDashboard({ force });
    },
    resetInsightsDashboard() {
      useInsightsStore.getState().resetDashboard();
    },
  };
}
