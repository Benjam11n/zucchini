import type { HistoryStatus } from "@/renderer/lib/history-status";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export interface HistoryPageProps {
  history: HistoryDay[];
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: "error" | "idle" | "loading" | "ready";
  onSelectWeeklyReview: (weekStart: string) => void;
}

export interface HistoryCalendarContextValue {
  historyByDate: Map<string, HistoryDay>;
  onSelectDate: (dateKey: string) => void;
  selectedDateKey: string | null;
}

export interface ContributionCell {
  date: string;
  isToday: boolean;
  status: HistoryStatus;
  summary: DailySummary | null;
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
}
