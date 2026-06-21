import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";

export type InsightsPhase = AsyncPhase;
type AsyncPhase = "error" | "idle" | "loading" | "ready";

export interface InsightsPageActions {
  insights: {
    retryLoad: () => void;
    selectRangeDays: (rangeDays: InsightsRangeDays) => void;
  };
}

export interface InsightsPageViewModel {
  dashboard: InsightsDashboard | null;
  error: AppIpcError | null;
  phase: InsightsPhase;
  rangeDays: InsightsRangeDays;
}
