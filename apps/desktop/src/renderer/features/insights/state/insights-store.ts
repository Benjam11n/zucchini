import { create } from "zustand";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { InsightsDashboard } from "@/shared/domain/insights";

import type { InsightsPhase } from "../insights.types";

interface InsightsStoreState {
  dashboard: InsightsDashboard | null;
  error: HabitsIpcError | null;
  phase: InsightsPhase;
  loadDashboard: (options?: { force?: boolean }) => Promise<void>;
  resetDashboard: () => void;
}

export const useInsightsStore = create<InsightsStoreState>()((set, get) => ({
  dashboard: null,
  error: null,
  loadDashboard: async (options = {}) => {
    if (!options.force && get().dashboard) {
      return;
    }

    if (get().phase === "loading") {
      return;
    }

    await runAsyncTask(() => habitsClient.getInsightsDashboard(), {
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
        });
      },
    });
  },
  phase: "idle",
  resetDashboard: () => {
    set({
      dashboard: null,
      error: null,
      phase: "idle",
    });
  },
}));
