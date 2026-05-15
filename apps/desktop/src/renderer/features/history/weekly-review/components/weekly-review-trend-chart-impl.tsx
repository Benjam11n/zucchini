import { WeeklyReviewChartCard } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-card";
import { ChartContainer } from "@/renderer/shared/components/ui/chart-container";
import { ChartLegend } from "@/renderer/shared/components/ui/chart-legend";
import { ChartTooltipContent } from "@/renderer/shared/components/ui/chart-tooltip-content";
import type { ChartConfig } from "@/renderer/shared/components/ui/chart-types";
import { LineChart } from "@/renderer/shared/components/ui/line-chart";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-2)",
    label: "Weekly completion",
  },
  focusMinutes: {
    color: "var(--color-chart-4)",
    label: "Focus minutes",
  },
} satisfies ChartConfig;

const CHART_SIZE = {
  height: 220,
  width: 640,
};
const CHART_PADDING = {
  bottom: 28,
  left: 44,
  right: 44,
  top: 10,
};
const COMPLETION_TICKS = [0, 25, 50, 75, 100] as const;

function getFocusTicks(maxFocusMinutes: number): number[] {
  if (maxFocusMinutes <= 0) {
    return [0];
  }

  const midpoint = Math.round(maxFocusMinutes / 2);

  return [...new Set([0, midpoint, maxFocusMinutes])];
}

interface WeeklyReviewTrendChartDatum extends WeeklyReviewTrendPoint {
  id: string;
}

interface WeeklyReviewTrendChartImplProps {
  trend: WeeklyReviewTrendPoint[];
}

export function WeeklyReviewTrendChartImpl({
  trend,
}: WeeklyReviewTrendChartImplProps) {
  const maxFocusMinutes = Math.max(
    0,
    ...trend.map((point) => point.focusMinutes)
  );
  const chartData: WeeklyReviewTrendChartDatum[] = trend.map((point) => ({
    ...point,
    id: point.weekStart,
  }));

  return (
    <WeeklyReviewChartCard
      action={
        <ChartLegend
          items={[
            {
              color: chartConfig.completionRate.color,
              label: chartConfig.completionRate.label,
            },
            {
              color: chartConfig.focusMinutes.color,
              label: chartConfig.focusMinutes.label,
            },
          ]}
        />
      }
      title="Trend line"
    >
      <ChartContainer config={chartConfig}>
        <LineChart
          ariaLabel="Weekly review trend chart"
          data={chartData}
          defaultSize={CHART_SIZE}
          linearScaleMax={maxFocusMinutes}
          padding={CHART_PADDING}
          percentAxis={{
            formatTick: (tick) => `${tick}%`,
            ticks: COMPLETION_TICKS,
          }}
          renderTooltip={({ activeDatum, style }) => (
            <div className="pointer-events-none absolute" style={style}>
              <ChartTooltipContent
                active={activeDatum !== null}
                formatter={(value, name) =>
                  name === chartConfig.completionRate.label
                    ? `${value}%`
                    : value
                }
                label={activeDatum?.label}
                payload={[
                  {
                    color: "var(--color-focusMinutes)",
                    dataKey: "focusMinutes",
                    name: chartConfig.focusMinutes.label,
                    value: activeDatum?.focusMinutes ?? 0,
                  },
                  {
                    color: "var(--color-completionRate)",
                    dataKey: "completionRate",
                    name: chartConfig.completionRate.label,
                    value: activeDatum?.completionRate ?? 0,
                  },
                ]}
              />
            </div>
          )}
          rightAxis={{
            ticks: getFocusTicks(maxFocusMinutes),
          }}
          series={[
            {
              ariaLabel: (point, value) =>
                `${point.label}: ${value} focus minutes`,
              color: "var(--color-focusMinutes)",
              lineTestId: "trend-focus-line",
              markerTestId: "trend-focus-dot",
              scale: "linear",
              value: (point) => point.focusMinutes,
            },
            {
              ariaLabel: (point, value) =>
                `${point.label}: ${value}% weekly completion`,
              color: "var(--color-completionRate)",
              lineTestId: "trend-completion-line",
              markerTestId: "trend-completion-dot",
              scale: "percent",
              value: (point) => point.completionRate,
            },
          ]}
        />
      </ChartContainer>
    </WeeklyReviewChartCard>
  );
}
