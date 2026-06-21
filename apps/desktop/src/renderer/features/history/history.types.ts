/**
 * History page type definitions.
 *
 * Defines props for the history page and weekly review phase type.
 */
import type { HistoryStatus } from "@/renderer/shared/components/app/history-status/lib/history-status-ui";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type { HistorySummaryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

import type { HistoryViewModel } from "./hooks/use-history-view-state";

export type WeeklyReviewPhase = AsyncPhase;
type AsyncPhase = "error" | "idle" | "loading" | "ready";
export type ContributionIntensity = 0 | 1 | 2 | 3 | 4;
export type HistoryViewMode = "review" | "timeline";

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
  historyMode?: HistoryViewMode;
  selectedHistoryYear: number | null;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: AppIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
  viewModel?: HistoryViewModel;
  onHistoryModeChange?: (mode: HistoryViewMode) => void;
}

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
