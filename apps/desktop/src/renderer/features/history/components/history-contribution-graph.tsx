import { ContributionGraph } from "@/renderer/features/history/components/contribution-graph";
import { ContributionGraphSkeleton } from "@/renderer/features/history/components/contribution-graph-skeleton";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface HistoryContributionGraphProps {
  contributionHistory: HistorySummaryDay[];
  fallbackHistory: HistorySummaryDay[];
  rangeEnd: string;
  rangeStart: string;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
}

export function HistoryContributionGraph({
  contributionHistory,
  fallbackHistory,
  onSelectDate,
  rangeEnd,
  rangeStart,
  selectedDateKey,
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
        onSelectDate={onSelectDate}
      />
    );
  }

  return <ContributionGraphSkeleton />;
}
