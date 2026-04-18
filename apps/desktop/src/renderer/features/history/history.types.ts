/**
 * History page type definitions.
 *
 * Defines props for the history page, calendar context, and weekly review
 * phase type. The `HistoryCalendarContextValue` provides shared state for
 * the calendar grid and day detail panel components.
 */
import type { HistoryStatus } from "@/renderer/features/history/history-status";
import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export type WeeklyReviewPhase = AsyncPhase;

export interface HistoryPageProps {
  history: HistoryDay[];
  historyLoadError: HabitsIpcError | null;
  historyScope: "full" | "recent";
  isHistoryLoading: boolean;
  onLoadOlderHistory: () => void;
  onNavigateToToday: () => void;
  todayDate: string;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
  onSelectWeeklyReview: (weekStart: string) => void;
}

export interface HistoryCalendarContextValue {
  historyByDate: Map<string, HistoryDay>;
  onSelectDate: (dateKey: string) => void;
  selectedDateKey: string | null;
}

export type ContributionIntensity = 0 | 1 | 2 | 3 | 4;

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
  sickDays: number;
}
