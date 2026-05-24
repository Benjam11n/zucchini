import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";

export type InsightsPhase = AsyncPhase;

export interface InsightsPageProps {
  dashboard: InsightsDashboard | null;
  error: AppIpcError | null;
  phase: InsightsPhase;
  rangeDays: InsightsRangeDays;
  onRetryLoad: () => void;
  onSelectRangeDays: (rangeDays: InsightsRangeDays) => void;
}
