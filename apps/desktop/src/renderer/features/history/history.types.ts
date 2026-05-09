import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
/**
 * History page type definitions.
 *
 * Defines props for the history page and weekly review phase type.
 */
import type {
  ContributionIntensity,
  ContributionStatus as HistoryStatus,
} from "@/renderer/shared/types/contribution";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HistorySummaryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

import type { HistoryViewModel } from "./use-history-view-state";

export type WeeklyReviewPhase = AsyncPhase;

export interface HistoryPageProps {
  contributionHistory: HistorySummaryDay[];
  history: HistorySummaryDay[];
  historyYears: number[];
  historyLoadError: HabitsIpcError | null;
  onLoadHistoryYears: () => void;
  onNavigateToToday: () => void;
  onSelectHistoryMonth: (year: number, month: number) => void;
  onLoadWeeklyReviewOverview: () => void;
  todayDate: string;
  selectedHistoryYear: number | null;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
  onSelectWeeklyReview: (weekStart: string) => void;
  viewModel?: HistoryViewModel;
}

export type { ContributionIntensity };

export interface ContributionCell {
  completedCount: number;
  date: string;
  intensity: ContributionIntensity;
  isToday: boolean;
  status: HistoryStatus;
  summary: DailySummary | null;
  totalCount: number;
}

export interface ContributionWeek {
  cells: ContributionCell[];
  key: string;
}
