import { RefreshCw } from "lucide-react";
import { memo } from "react";

import { HabitLeaderboard } from "@/renderer/features/insights/components/habit-leaderboard";
import { InsightsEmptyState } from "@/renderer/features/insights/components/insights-empty-state";
import { InsightsErrorState } from "@/renderer/features/insights/components/insights-error-state";
import { InsightsLoadingState } from "@/renderer/features/insights/components/insights-loading-state";
import { MomentumCard } from "@/renderer/features/insights/components/momentum-card";
import { RangeSelector } from "@/renderer/features/insights/components/range-selector";
import { SmartInsightsCard } from "@/renderer/features/insights/components/smart-insights-card";
import { SummaryMetricCard } from "@/renderer/features/insights/components/summary-metric-card";
import { WeekdayRhythmCard } from "@/renderer/features/insights/components/weekday-rhythm-card";
import { WeeklyCompletionChart } from "@/renderer/features/insights/components/weekly-completion-chart";
import type {
  InsightsPageActions,
  InsightsPageViewModel,
} from "@/renderer/features/insights/insights.types";
import { formatInsightsDate } from "@/renderer/features/insights/lib/insights-format";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { TooltipProvider } from "@/renderer/shared/components/ui/tooltip";

interface InsightsPageProps {
  actions: InsightsPageActions;
  viewModel: InsightsPageViewModel;
}

export const InsightsPage = memo(function InsightsPage({
  actions,
  viewModel,
}: InsightsPageProps) {
  const { dashboard, error, phase, rangeDays } = viewModel;
  const { retryLoad, selectRangeDays } = actions.insights;
  if (phase === "loading" && !dashboard) {
    return <InsightsLoadingState />;
  }

  if (phase === "error" && !dashboard) {
    return <InsightsErrorState error={error} onRetryLoad={retryLoad} />;
  }

  if (!dashboard || dashboard.isEmpty) {
    return (
      <InsightsEmptyState
        onRetryLoad={retryLoad}
        onSelectRangeDays={selectRangeDays}
        rangeDays={rangeDays}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Insights
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.period.label} ending{" "}
              {formatInsightsDate(dashboard.generatedAtDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RangeSelector
              onSelectRangeDays={selectRangeDays}
              rangeDays={rangeDays}
            />
            <Button
              onClick={retryLoad}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </section>

        <Card>
          <CardContent className="grid gap-0 py-1 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetricCard metric={dashboard.summary.completed} />
            <SummaryMetricCard metric={dashboard.summary.focus} />
            <SummaryMetricCard metric={dashboard.summary.perfectDays} />
            <SummaryMetricCard metric={dashboard.summary.savedStreaks} />
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <MomentumCard dashboard={dashboard} />
          </div>
          <div className="lg:col-span-2">
            <WeeklyCompletionChart weeks={dashboard.weeklyCompletion} />
          </div>
        </section>

        <section>
          <HabitLeaderboard habits={dashboard.habitLeaderboard} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SmartInsightsCard insights={dashboard.smartInsights} />
          <WeekdayRhythmCard rhythm={dashboard.weekdayRhythm} />
        </section>
      </div>
    </TooltipProvider>
  );
});
