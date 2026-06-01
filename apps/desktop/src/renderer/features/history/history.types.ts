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
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type { HistorySummaryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

import type { HistoryViewModel } from "./hooks/use-history-view-state";

export type WeeklyReviewPhase = AsyncPhase;

export interface HistoryPageActions {
  history: {
    loadYears: () => void;
    navigateToToday: () => void;
    selectMonth: (year: number, month: number) => void;
  };
  weeklyReview: {
    loadOverview: () => void;
    select: (weekStart: string) => void;
  };
}

export interface HistoryPageViewModel {
  contributionHistory: HistorySummaryDay[];
  history: HistorySummaryDay[];
  historyYears: number[];
  historyLoadError: AppIpcError | null;
  todayDate: string;
  selectedHistoryYear: number | null;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: AppIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
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
