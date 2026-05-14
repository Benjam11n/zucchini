import {
  Activity,
  BarChart3,
  Clock3,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { memo } from "react";

import type { InsightsPageProps } from "@/renderer/features/insights/insights.types";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { HabitCategoryMarker } from "@/renderer/shared/components/ui/habit-category-marker";
import { Progress } from "@/renderer/shared/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/renderer/shared/components/ui/table";
import { TextWithTooltip } from "@/renderer/shared/components/ui/text-with-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import type {
  InsightsDashboard,
  InsightsHabitLeaderboardItem,
  InsightsRangeDays,
  InsightsSmartInsight,
  InsightsSummaryMetric,
  InsightsWeekdayRhythm,
  InsightsWeeklyCompletion,
} from "@/shared/domain/insights";
import { INSIGHTS_RANGE_OPTIONS } from "@/shared/domain/insights";
import { formatDateKey } from "@/shared/utils/date";

interface SummaryMetricCardProps {
  metric: InsightsSummaryMetric;
}

const RANGE_LABELS: Record<InsightsRangeDays, string> = {
  180: "180d",
  30: "30d",
  365: "1y",
  7: "7d",
  90: "90d",
};

function RangeSelector({
  rangeDays,
  onSelectRangeDays,
}: {
  onSelectRangeDays: (rangeDays: InsightsRangeDays) => void;
  rangeDays: InsightsRangeDays;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
      {INSIGHTS_RANGE_OPTIONS.map((option) => (
        <Button
          aria-pressed={rangeDays === option}
          className="h-7 rounded-md px-2 text-xs"
          key={option}
          onClick={() => onSelectRangeDays(option)}
          type="button"
          variant={rangeDays === option ? "secondary" : "ghost"}
        >
          {RANGE_LABELS[option]}
        </Button>
      ))}
    </div>
  );
}

function formatInsightsDate(dateKey: string): string {
  return formatDateKey(
    dateKey,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    "en-US"
  );
}

function Sparkline({
  className,
  points,
}: {
  className?: string;
  points: number[];
}) {
  const width = 180;
  const height = 44;
  const safePoints =
    points.length > 1 ? points : [points.at(0) ?? 0, points.at(0) ?? 0];
  const polyline = safePoints
    .map((point, index) => {
      const x =
        safePoints.length === 1
          ? width
          : (index / (safePoints.length - 1)) * width;
      const y = height - (Math.max(0, Math.min(100, point)) / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className={cn("h-12 w-full overflow-visible", className)}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        points={polyline}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SummaryMetricCard({ metric }: SummaryMetricCardProps) {
  const isPositive = metric.deltaLabel.startsWith("+");

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2 border-border/70 px-3 py-2 first:pl-0 last:pr-0 lg:border-l lg:first:border-l-0">
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {metric.value}
          </span>
          <span className="truncate text-xs font-medium text-foreground">
            {metric.label}
          </span>
        </div>
        <p
          className={cn(
            "truncate text-xs",
            isPositive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {metric.deltaLabel}
        </p>
      </div>
      <div className="w-14 text-primary/80">
        <Sparkline className="h-4" points={metric.trend} />
      </div>
    </div>
  );
}

function MomentumCard({ dashboard }: { dashboard: InsightsDashboard }) {
  return (
    <Card className="min-h-[310px]">
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Momentum
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  aria-label="Momentum score details"
                  className="size-3.5 text-muted-foreground"
                  role="img"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-72 leading-relaxed">
                Momentum combines current completion rate, change vs the
                previous period, and current streak.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>{dashboard.momentum.label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid justify-items-center gap-5">
        <div
          className="relative grid size-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) 0deg, var(--primary) ${
              dashboard.momentum.score * 3.6
            }deg, var(--muted) ${dashboard.momentum.score * 3.6}deg)`,
          }}
        >
          <div className="grid size-36 place-items-center rounded-full bg-card">
            <div className="text-center">
              <div className="text-5xl font-semibold tracking-tight tabular-nums">
                {dashboard.momentum.score}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
          </div>
        </div>
        <div className="w-full text-primary">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Sparkline points={dashboard.momentum.sparkline} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Trend: {dashboard.momentum.sparkline.join("%, ")}%
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyCompletionChart({
  weeks,
}: {
  weeks: InsightsWeeklyCompletion[];
}) {
  return (
    <Card className="min-h-[310px] lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            Habit completion by week
          </CardTitle>
          <CardDescription>
            Completed, partial, and missed opportunities
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-primary" />
            Completed
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-primary/30" />
            Partial
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-muted" />
            Missed
          </span>
        </div>
        <div className="grid h-48 auto-cols-[minmax(2rem,1fr)] grid-flow-col items-end gap-3 overflow-x-auto pb-2">
          {weeks.map((week) => (
            <div key={week.weekStart} className="grid min-w-0 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label={`${week.label}: ${week.completedCount} completed, ${week.partialCount} partial, ${week.missedCount} missed out of ${week.totalCount} opportunities`}
                    className="flex h-40 w-full flex-col-reverse overflow-hidden rounded-md bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                  >
                    <div
                      className="w-full bg-primary/90"
                      style={{ height: `${week.completedPercent}%` }}
                    />
                    <div
                      className="w-full bg-primary/30"
                      style={{ height: `${week.partialPercent}%` }}
                    />
                    <div
                      className="w-full bg-muted-foreground/20"
                      style={{ height: `${week.missedPercent}%` }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="grid gap-1">
                  <span>
                    {week.weekStart} to {week.weekEnd}
                  </span>
                  <span>
                    {week.completedCount} completed, {week.partialCount}{" "}
                    partial, {week.missedCount} missed
                  </span>
                  <span>{week.totalCount} opportunities</span>
                </TooltipContent>
              </Tooltip>
              <span className="truncate text-center text-[0.68rem] text-muted-foreground">
                {week.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SmartInsightRow({ insight }: { insight: InsightsSmartInsight }) {
  let severityLabel = "Note";
  if (insight.severity === "warning") {
    severityLabel = "Watch";
  } else if (insight.severity === "positive") {
    severityLabel = "Strong";
  }

  return (
    <div className="grid gap-2 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "h-5 rounded border px-1.5 py-0 text-[0.68rem] font-medium uppercase tracking-wide",
            insight.severity === "warning"
              ? "border-amber-500/35 bg-amber-500/8 text-amber-600"
              : "border-primary/25 bg-primary/8 text-primary"
          )}
          variant="outline"
        >
          {severityLabel}
        </Badge>
        <p className="min-w-0 truncate font-medium text-foreground">
          {insight.title}
        </p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{insight.body}</p>
    </div>
  );
}

function SmartInsightsCard({ insights }: { insights: InsightsSmartInsight[] }) {
  return (
    <Card className="min-h-[310px]">
      <CardHeader>
        <CardTitle>Smart insights</CardTitle>
        <CardDescription>Small patterns worth acting on</CardDescription>
      </CardHeader>
      <CardContent className="grid content-start">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <SmartInsightRow insight={insight} key={insight.title} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            More history will unlock trend insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HabitLeaderboard({
  habits,
}: {
  habits: InsightsHabitLeaderboardItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Habit leaderboard
          </CardTitle>
          <CardDescription>Top habits by 30-day completion</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete habits for a few days to build a leaderboard.
          </p>
        ) : (
          <Table className="table-fixed">
            <TableHeader className="text-xs">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="w-8 px-0 pr-2">#</TableHead>
                <TableHead className="px-4">Habit</TableHead>
                <TableHead className="w-32 px-2">Category</TableHead>
                <TableHead className="w-44 px-2">Completion</TableHead>
                <TableHead className="hidden w-36 px-0 pl-3 sm:table-cell">
                  Trend
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.map((habit) => (
                <TableRow
                  key={habit.habitId}
                  className="border-border/50 hover:bg-muted/20"
                >
                  <TableCell className="px-0 py-4 pr-2 text-muted-foreground tabular-nums">
                    {habit.rank}
                  </TableCell>
                  <TableCell className="min-w-0 p-4 font-medium text-foreground">
                    <TextWithTooltip content={habit.name} />
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <HabitCategoryMarker
                      category={habit.category}
                      variant="badge"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-10 shrink-0 tabular-nums">
                        {habit.completionRate}%
                      </span>
                      <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {habit.completedCount} / {habit.totalCount}
                      </span>
                      <Progress
                        className="h-2 min-w-10 flex-1"
                        value={habit.completionRate}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-0 py-4 pl-3 text-primary sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label={`${habit.name} trend: ${habit.trend.join("%, ")}%`}
                          className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          type="button"
                        >
                          <Sparkline className="h-8" points={habit.trend} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-72 leading-relaxed">
                        {habit.completedCount}/{habit.totalCount} opportunities
                        completed. Trend: {habit.trend.join("%, ")}%
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function getRhythmCellClassName(intensity: number): string {
  if (intensity >= 75) {
    return "bg-primary text-primary-foreground";
  }

  if (intensity >= 50) {
    return "bg-primary/70 text-primary-foreground";
  }

  if (intensity >= 25) {
    return "bg-primary/35 text-foreground";
  }

  if (intensity > 0) {
    return "bg-primary/15 text-muted-foreground";
  }

  return "bg-muted/50 text-muted-foreground";
}

function WeekdayRhythmCard({ rhythm }: { rhythm: InsightsWeekdayRhythm }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />
            {rhythm.title}
          </CardTitle>
          <CardDescription>{rhythm.subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-[4.75rem_repeat(7,minmax(0,1fr))] gap-2 text-xs">
          <div />
          {rhythm.weekdayLabels.map((weekday) => (
            <div className="text-center text-muted-foreground" key={weekday}>
              {weekday}
            </div>
          ))}
          {rhythm.timeOfDayLabels.map((timeOfDayLabel, rowIndex) => {
            const [label, subtitle] = timeOfDayLabel.split("\n");
            const rowCells = rhythm.cells.slice(rowIndex * 7, rowIndex * 7 + 7);

            return (
              <div className="contents" key={timeOfDayLabel}>
                <div className="self-center">
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="text-[0.68rem] text-muted-foreground">
                    {subtitle}
                  </div>
                </div>
                {rowCells.map((cell) => (
                  <div
                    aria-label={cell.label}
                    className={cn(
                      "grid h-9 min-w-0 place-items-center rounded-md text-[0.68rem] font-medium tabular-nums",
                      getRhythmCellClassName(cell.intensity)
                    )}
                    key={`${cell.timeOfDay}-${cell.weekday}`}
                    title={cell.label}
                  >
                    {cell.completionCount > 0 ? cell.completionCount : ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Completions</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted/50" />0
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary/15" /> Low
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary/70" /> High
          </span>
          <span className="ml-auto text-[0.68rem]">
            Peak: {rhythm.maxCompletionCount}
          </span>
        </div>
        {rhythm.hasData ? null : (
          <p className="text-sm text-muted-foreground">
            Complete a few habits to reveal your time-of-day rhythm.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  onRetryLoad,
  onSelectRangeDays,
  rangeDays,
}: Pick<InsightsPageProps, "onRetryLoad" | "onSelectRangeDays" | "rangeDays">) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid justify-items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Activity className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No insights yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Complete habits or record focus sessions for a few days to unlock
            the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <RangeSelector
            onSelectRangeDays={onSelectRangeDays}
            rangeDays={rangeDays}
          />
          <Button
            onClick={onRetryLoad}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-md bg-muted" />
        <div className="h-72 animate-pulse rounded-md bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetryLoad,
}: Pick<InsightsPageProps, "error" | "onRetryLoad">) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-destructive">
            Insights failed to load.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "Try refreshing the dashboard."}
          </p>
        </div>
        <Button onClick={onRetryLoad} size="sm" type="button" variant="outline">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function InsightsPageComponent({
  dashboard,
  error,
  phase,
  rangeDays,
  onRetryLoad,
  onSelectRangeDays,
}: InsightsPageProps) {
  if (phase === "loading" && !dashboard) {
    return <LoadingState />;
  }

  if (phase === "error" && !dashboard) {
    return <ErrorState error={error} onRetryLoad={onRetryLoad} />;
  }

  if (!dashboard || dashboard.isEmpty) {
    return (
      <EmptyState
        onRetryLoad={onRetryLoad}
        onSelectRangeDays={onSelectRangeDays}
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
              onSelectRangeDays={onSelectRangeDays}
              rangeDays={rangeDays}
            />
            <Button
              onClick={onRetryLoad}
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
}

export const InsightsPage = memo(InsightsPageComponent);
