import { ContributionGraph } from "@/renderer/features/history/components/contribution-graph";
import { ContributionGraphSkeleton } from "@/renderer/features/history/components/contribution-graph-skeleton";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface HistoryContributionGraphProps {
  contributionHistory: HistorySummaryDay[];
  fallbackHistory: HistorySummaryDay[];
  rangeEnd: string;
  rangeStart: string;
  selectedDateKey: string | null;
  todayDate: string;
  onSelectDate: (dateKey: string) => void;
}

export function HistoryContributionGraph({
  contributionHistory,
  fallbackHistory,
  onSelectDate,
  rangeEnd,
  rangeStart,
  selectedDateKey,
  todayDate,
}: HistoryContributionGraphProps) {
  const graphHistory =
    contributionHistory.length > 0 ? contributionHistory : fallbackHistory;

  if (graphHistory.length > 0) {
    return (
      <ContributionGraph
        history={graphHistory}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
        selectedDateKey={selectedDateKey}
        todayDate={todayDate}
        onSelectDate={onSelectDate}
      />
    );
  }

  return <ContributionGraphSkeleton />;
}
