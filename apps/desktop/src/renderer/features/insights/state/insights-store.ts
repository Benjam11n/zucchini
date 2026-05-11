import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";

import type { InsightsPhase } from "../insights.types";

interface InsightsStoreState {
  dashboard: InsightsDashboard | null;
  error: HabitsIpcError | null;
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

    await runAsyncTask(() => habitsClient.getInsightsDashboard(rangeDays), {
      mapError: toHabitsIpcError,
      onError: (error) => {
        set({
          error,
          phase: "error",
        });
      },
      onStart: () => {
        set({
          error: null,
          phase: "loading",
        });
      },
      onSuccess: (dashboard) => {
        set({
          dashboard,
          error: null,
          phase: "ready",
          rangeDays,
        });
      },
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
