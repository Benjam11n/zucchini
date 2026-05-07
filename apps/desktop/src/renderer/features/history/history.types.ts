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
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export type WeeklyReviewPhase = AsyncPhase;

export interface HistoryPageProps {
  history: HistoryDay[];
  historyYears: number[];
  historyLoadError: HabitsIpcError | null;
  isHistoryLoading: boolean;
  onLoadHistoryYears: () => void;
  onNavigateToToday: () => void;
  onSelectHistoryYear: (year: number) => void;
  todayDate: string;
  selectedHistoryYear: number | null;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
  onSelectWeeklyReview: (weekStart: string) => void;
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

export interface HistoryStats {
  completedDays: number;
  completionRate: number;
  freezeDays: number;
  missedDays: number;
  rescheduledDays: number;
  restDays: number;
  sickDays: number;
}
