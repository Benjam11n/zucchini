import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";

export type InsightsPhase = AsyncPhase;

export interface InsightsPageProps {
  dashboard: InsightsDashboard | null;
  error: HabitsIpcError | null;
  phase: InsightsPhase;
  rangeDays: InsightsRangeDays;
  onRetryLoad: () => void;
  onSelectRangeDays: (rangeDays: InsightsRangeDays) => void;
}
