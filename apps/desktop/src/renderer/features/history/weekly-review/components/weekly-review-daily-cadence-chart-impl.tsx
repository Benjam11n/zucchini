import { WeeklyReviewChartCard } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-card";
import { BarChart } from "@/renderer/shared/components/ui/bar-chart";
import { ChartContainer } from "@/renderer/shared/components/ui/chart-container";
import { ChartTooltipContent } from "@/renderer/shared/components/ui/chart-tooltip-content";
import type { ChartConfig } from "@/renderer/shared/components/ui/chart-types";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-1)",
    label: "Completion",
  },
} satisfies ChartConfig;

const CHART_SIZE = {
  height: 220,
  width: 640,
};
const CHART_PADDING = {
  bottom: 28,
  left: 44,
  right: 14,
  top: 10,
};
const Y_TICKS = [0, 25, 50, 75, 100] as const;

function formatPercentage(value: number | string): string {
  return `${value}%`;
}

interface WeeklyReviewDailyCadenceChartImplProps {
  review: WeeklyReview;
}

export function WeeklyReviewDailyCadenceChartImpl({
  review,
}: WeeklyReviewDailyCadenceChartImplProps) {
  const chartData = review.dailyCadence.map((day) => ({
    ariaLabel: `${day.label}: ${
      day.completionRate === null
        ? "No tracked habits"
        : formatPercentage(day.completionRate)
    } completion`,
    id: day.date,
    label: day.shortLabel,
    tooltipLabel: day.label,
    value: day.completionRate,
  }));

  return (
    <WeeklyReviewChartCard title="Daily cadence">
      <ChartContainer config={chartConfig}>
        <BarChart
          ariaLabel="Daily cadence completion chart"
          barColor="var(--color-completionRate)"
          barTestId="daily-cadence-bar"
          data={chartData}
          defaultSize={CHART_SIZE}
          padding={CHART_PADDING}
          renderTooltip={({ activeDatum, style }) => (
            <div className="pointer-events-none absolute" style={style}>
              <ChartTooltipContent
                active={activeDatum !== null && activeDatum.value !== null}
                formatter={formatPercentage}
                indicator="line"
                label={activeDatum?.tooltipLabel}
                payload={[
                  {
                    color: "var(--color-completionRate)",
                    dataKey: "completionRate",
                    name: chartConfig.completionRate.label,
                    value: activeDatum?.value ?? 0,
                  },
                ]}
              />
            </div>
          )}
          yAxis={{
            formatTick: formatPercentage,
            ticks: Y_TICKS,
          }}
        />
      </ChartContainer>
    </WeeklyReviewChartCard>
  );
}
