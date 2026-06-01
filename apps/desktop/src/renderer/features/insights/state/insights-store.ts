import { create } from "zustand";

import { appClient } from "@/renderer/shared/lib/app-client";
import { runStoreLoad } from "@/renderer/shared/lib/store-load-task";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";

import type { InsightsPhase } from "../insights.types";

interface InsightsStoreState {
  dashboard: InsightsDashboard | null;
  error: AppIpcError | null;
  phase: InsightsPhase;
  rangeDays: InsightsRangeDays;
  loadDashboard: (options?: {
    force?: boolean;
    rangeDays?: InsightsRangeDays;
  }) => Promise<void>;
  resetDashboard: () => void;
  setRangeDays: (rangeDays: InsightsRangeDays) => Promise<void>;
}

export const useInsightsStore = create<InsightsStoreState>()((set, get) => ({
  dashboard: null,
  error: null,
  loadDashboard: async (options = {}) => {
    const rangeDays = options.rangeDays ?? get().rangeDays;

    if (!options.force && get().dashboard && get().rangeDays === rangeDays) {
      return;
    }

    if (get().phase === "loading") {
      return;
    }

    await runStoreLoad<InsightsStoreState, InsightsDashboard>({
      error: (error) => ({
        error,
        phase: "error",
      }),
      loading: {
        error: null,
        phase: "loading",
      },
      set,
      success: (dashboard) => ({
        dashboard,
        error: null,
        phase: "ready",
        rangeDays,
      }),
      task: () => appClient.getInsightsDashboard(rangeDays),
    });
  },
  phase: "idle",
  rangeDays: 30,
  resetDashboard: () => {
    set({
      dashboard: null,
      error: null,
      phase: "idle",
    });
  },
  setRangeDays: async (rangeDays) => {
    set({ rangeDays });
    await get().loadDashboard({ force: true, rangeDays });
  },
}));
