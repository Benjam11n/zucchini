/**
 * History tab page.
 *
 * This screen lets the user inspect past days and switch into weekly review
 * mode, combining the calendar browser, day detail panel, and deferred charts.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { BarChart3, CalendarDays } from "lucide-react";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { HistoryCalendarCard } from "@/renderer/features/history/components/history-calendar-card";
import { HistoryDayPanel } from "@/renderer/features/history/components/history-day-panel";
import { HISTORY_METRIC_BADGE_CLASSNAMES } from "@/renderer/features/history/history-status";
import type {
  HistoryCalendarContextValue,
  HistoryPageProps,
} from "@/renderer/features/history/history.types";
import {
  buildContributionWeeks,
  formatContributionLabel,
} from "@/renderer/features/history/lib/history-contributions";
import {
  getHistoryDayLookup,
  getHistoryStats,
} from "@/renderer/features/history/lib/history-summary";
import { WeeklyReviewHeroCard } from "@/renderer/features/history/weekly-review/components/weekly-review-hero-card";
import { WeeklyReviewMostMissedCard } from "@/renderer/features/history/weekly-review/components/weekly-review-most-missed-card";
import { WeeklyReviewStats } from "@/renderer/features/history/weekly-review/components/weekly-review-stats";
import { GitHubCalendar } from "@/renderer/shared/components/github-calendar";
import {
  hoverLift,
  staggerContainerVariants,
  staggerItemVariants,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import { Spinner } from "@/renderer/shared/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/renderer/shared/ui/tabs";
import { parseDateKey } from "@/shared/utils/date";

const WeeklyReviewDailyCadenceChart = lazy(() =>
  import("@/renderer/features/history/weekly-review/components/weekly-review-daily-cadence-chart").then(
    (module) => ({
      default: module.WeeklyReviewDailyCadenceChart,
    })
  )
);

const WeeklyReviewHabitChart = lazy(() =>
  import("@/renderer/features/history/weekly-review/components/weekly-review-habit-chart").then(
    (module) => ({
      default: module.WeeklyReviewHabitChart,
    })
  )
);

const WeeklyReviewTrendChart = lazy(() =>
  import("@/renderer/features/history/weekly-review/components/weekly-review-trend-chart").then(
    (module) => ({
      default: module.WeeklyReviewTrendChart,
    })
  )
);

interface HistoryViewState {
  selectedDateKey: string | null;
  selectedYear: number;
  visibleMonth: Date | undefined;
}

function createHistoryViewState(
  history: HistoryPageProps["history"],
  todayDate: string
): HistoryViewState {
  const fallbackDate = history[0]?.date ?? todayDate;
  const fallbackYear = Number.parseInt(fallbackDate.slice(0, 4), 10);

  return {
    selectedDateKey: fallbackDate,
    selectedYear: fallbackYear,
    visibleMonth: fallbackDate ? parseDateKey(fallbackDate) : undefined,
  };
}

function ChartSectionFallback() {
  return (
    <Card className="border-border/60 bg-card/95">
      <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
        <Spinner className="size-4 text-primary/70" />
        Loading chart...
      </CardContent>
    </Card>
  );
}

function WeeklyReviewSection({
  onSelectWeeklyReview,
  selectedWeeklyReview,
  weeklyReviewError,
  weeklyReviewOverview,
  weeklyReviewPhase,
}: Pick<
  HistoryPageProps,
  | "onSelectWeeklyReview"
  | "selectedWeeklyReview"
  | "weeklyReviewError"
  | "weeklyReviewOverview"
  | "weeklyReviewPhase"
>) {
  const review =
    selectedWeeklyReview ?? weeklyReviewOverview?.latestReview ?? null;

  if (
    (weeklyReviewPhase === "idle" || weeklyReviewPhase === "loading") &&
    !review
  ) {
    return (
      <Card className="border-border/60 bg-card/95">
        <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
          <Spinner className="size-4 text-primary/70" />
          Building weekly review...
        </CardContent>
      </Card>
    );
  }

  if (!review) {
    if (weeklyReviewError) {
      return (
        <Card className="border-border/60 bg-card/95">
          <CardHeader>
            <CardDescription>Weekly Review</CardDescription>
            <CardTitle>Could not load weekly review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {weeklyReviewError.message}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-border/60 bg-card/95">
        <CardHeader>
          <CardDescription>Weekly Review</CardDescription>
          <CardTitle>Not enough history yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Finish a full Monday-Sunday cycle to unlock weekly review cards and
          charts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {weeklyReviewError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {weeklyReviewError.message}
        </div>
      ) : null}

      <WeeklyReviewHeroCard
        availableWeeks={weeklyReviewOverview?.availableWeeks ?? []}
        isLoading={weeklyReviewPhase === "loading"}
        onSelectWeek={onSelectWeeklyReview}
        review={review}
      />
      <WeeklyReviewStats review={review} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Suspense fallback={<ChartSectionFallback />}>
          <WeeklyReviewDailyCadenceChart review={review} />
        </Suspense>
        <Suspense fallback={<ChartSectionFallback />}>
          <WeeklyReviewTrendChart trend={weeklyReviewOverview?.trend ?? []} />
        </Suspense>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Suspense fallback={<ChartSectionFallback />}>
          <WeeklyReviewHabitChart habitMetrics={review.habitMetrics} />
        </Suspense>
        <WeeklyReviewMostMissedCard habits={review.mostMissedHabits} />
      </div>
    </div>
  );
}

export function HistoryPage({
  history,
  historyLoadError,
  historyScope,
  isHistoryLoading,
  onLoadOlderHistory,
  todayDate,
  onSelectWeeklyReview,
  selectedWeeklyReview,
  weeklyReviewError,
  weeklyReviewOverview,
  weeklyReviewPhase,
}: HistoryPageProps) {
  const [viewState, setViewState] = useState<HistoryViewState>(() =>
    createHistoryViewState(history, todayDate)
  );
  const availableYears = useMemo(
    () =>
      [
        ...new Set(
          history.map((day) => Number.parseInt(day.date.slice(0, 4), 10))
        ),
      ]
        .filter((year) => !Number.isNaN(year))
        .toSorted((left, right) => right - left),
    [history]
  );
  const filteredHistory = useMemo(
    () =>
      history.filter(
        (day) =>
          Number.parseInt(day.date.slice(0, 4), 10) === viewState.selectedYear
      ),
    [history, viewState.selectedYear]
  );
  const stats = getHistoryStats(filteredHistory);
  const historyByDate = useMemo(
    () => getHistoryDayLookup(filteredHistory),
    [filteredHistory]
  );
  const selectedDay =
    (viewState.selectedDateKey
      ? historyByDate.get(viewState.selectedDateKey)
      : null) ??
    filteredHistory[0] ??
    null;
  const calendarWeeks = buildContributionWeeks(filteredHistory).map((week) => ({
    ...week,
    cells: week.cells.map((cell) => ({
      completedCount: cell.completedCount,
      date: cell.date,
      intensity: cell.intensity,
      isToday: cell.isToday,
      label: formatContributionLabel(cell),
      status: cell.status,
      totalCount: cell.totalCount,
    })),
  }));

  useEffect(() => {
    const selectedYearStillExists = availableYears.includes(
      viewState.selectedYear
    );
    const nextSelectedYear = selectedYearStillExists
      ? viewState.selectedYear
      : (availableYears[0] ?? Number.parseInt(todayDate.slice(0, 4), 10));
    const nextHistory = history.filter(
      (day) => Number.parseInt(day.date.slice(0, 4), 10) === nextSelectedYear
    );
    const fallbackDate = nextHistory[0]?.date ?? null;

    if (!fallbackDate) {
      setViewState({
        selectedDateKey: null,
        selectedYear: nextSelectedYear,
        visibleMonth: undefined,
      });
      return;
    }

    setViewState((current) => ({
      selectedDateKey:
        current.selectedDateKey &&
        nextHistory.some((day) => day.date === current.selectedDateKey)
          ? current.selectedDateKey
          : fallbackDate,
      selectedYear: nextSelectedYear,
      visibleMonth:
        current.visibleMonth &&
        current.visibleMonth.getFullYear() === nextSelectedYear
          ? current.visibleMonth
          : parseDateKey(fallbackDate),
    }));
  }, [availableYears, history, todayDate, viewState.selectedYear]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setViewState({
      selectedDateKey: dateKey,
      selectedYear: Number.parseInt(dateKey.slice(0, 4), 10),
      visibleMonth: parseDateKey(dateKey),
    });
  }, []);

  const historyCalendarContextValue: HistoryCalendarContextValue = useMemo(
    () => ({
      historyByDate,
      onSelectDate: handleSelectDate,
      selectedDateKey: selectedDay?.date ?? null,
    }),
    [handleSelectDate, historyByDate, selectedDay?.date]
  );

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <Tabs defaultValue="daily" className="w-full">
          <m.section variants={staggerItemVariants}>
            <TabsList className="mb-6 w-full rounded-2xl bg-muted/80 p-1">
              <TabsTrigger className="flex-1" value="daily">
                <CalendarDays className="size-4" />
                Daily View
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="weekly">
                <BarChart3 className="size-4" />
                Weekly View
              </TabsTrigger>
            </TabsList>
          </m.section>

          <TabsContent value="daily">
            <m.div
              className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]"
              variants={staggerItemVariants}
            >
              <Card>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          className:
                            HISTORY_METRIC_BADGE_CLASSNAMES.completionRate,
                          label: `${stats.completionRate}% completion`,
                        },
                        {
                          className:
                            HISTORY_METRIC_BADGE_CLASSNAMES.completedDays,
                          label: `${stats.completedDays} complete`,
                        },
                        {
                          className: HISTORY_METRIC_BADGE_CLASSNAMES.freezeDays,
                          label: `${stats.freezeDays} freeze saves`,
                        },
                        {
                          className: HISTORY_METRIC_BADGE_CLASSNAMES.missedDays,
                          label: `${stats.missedDays} missed`,
                        },
                      ].map((statBadge) => (
                        <m.div
                          key={statBadge.label}
                          whileHover={hoverLift}
                          whileTap={tapPress}
                        >
                          <Badge
                            className={statBadge.className}
                            variant="outline"
                          >
                            {statBadge.label}
                          </Badge>
                        </m.div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {historyScope === "recent" ? (
                        <Button
                          disabled={isHistoryLoading}
                          onClick={onLoadOlderHistory}
                          variant="outline"
                        >
                          {isHistoryLoading
                            ? "Loading older history..."
                            : "Load older history"}
                        </Button>
                      ) : null}
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Year</span>
                        <select
                          aria-label="Select history year"
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          onChange={(event) => {
                            const nextYear = Number.parseInt(
                              event.target.value,
                              10
                            );
                            const fallbackDate =
                              history.find(
                                (day) =>
                                  Number.parseInt(day.date.slice(0, 4), 10) ===
                                  nextYear
                              )?.date ?? null;

                            setViewState({
                              selectedDateKey: fallbackDate,
                              selectedYear: nextYear,
                              visibleMonth: fallbackDate
                                ? parseDateKey(fallbackDate)
                                : undefined,
                            });
                          }}
                          value={viewState.selectedYear}
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  {historyLoadError && historyScope !== "full" ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                      {historyLoadError.message}
                    </div>
                  ) : null}
                  <GitHubCalendar weeks={calendarWeeks} />
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <HistoryCalendarCard
                  historyByDate={historyByDate}
                  historyCalendarContextValue={historyCalendarContextValue}
                  onSelectDateKey={(dateKey) => {
                    setViewState((current) => ({
                      ...current,
                      selectedDateKey: dateKey,
                    }));
                  }}
                  selectedDay={selectedDay}
                  setVisibleMonth={(visibleMonth) => {
                    setViewState((current) => ({
                      ...current,
                      visibleMonth,
                    }));
                  }}
                  visibleMonth={viewState.visibleMonth}
                />
                <HistoryDayPanel
                  selectedDay={selectedDay}
                  isToday={selectedDay?.date === todayDate}
                />
              </div>
            </m.div>
          </TabsContent>

          <TabsContent value="weekly">
            <m.section variants={staggerItemVariants}>
              <WeeklyReviewSection
                onSelectWeeklyReview={onSelectWeeklyReview}
                selectedWeeklyReview={selectedWeeklyReview}
                weeklyReviewError={weeklyReviewError}
                weeklyReviewOverview={weeklyReviewOverview}
                weeklyReviewPhase={weeklyReviewPhase}
              />
            </m.section>
          </TabsContent>
        </Tabs>
      </m.div>
    </LazyMotion>
  );
}
