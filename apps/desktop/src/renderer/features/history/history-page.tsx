/**
 * History tab page.
 *
 * Shows the selected year timeline and weekly review in a compact layout that
 * pairs with the shell right sidebar.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { HistoryDayPanel } from "@/renderer/features/history/components/history-day-panel";
import { WeeklyReviewSection } from "@/renderer/features/history/components/weekly-review-section";
import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import {
  buildContributionWeeks,
  formatContributionLabel,
} from "@/renderer/features/history/lib/history-contributions";
import { getActivityStatus } from "@/renderer/features/history/lib/history-summary";
import {
  formatFocusMinutes,
  getDailyCompletionPercent,
} from "@/renderer/features/history/lib/history-timeline";
import { useHistoryViewState } from "@/renderer/features/history/use-history-view-state";
import { ContributionSquare } from "@/renderer/shared/components/github-contribution-square";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/shared/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/renderer/shared/components/ui/tabs";
import { TooltipProvider } from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey, parseDateKey, toDateKey } from "@/shared/utils/date";

type HistoryViewMode = "review" | "timeline";

function ContributionGraph({
  history,
  onSelectDate,
  rangeEnd,
  rangeStart,
  selectedDateKey,
}: {
  history: HistoryDay[];
  rangeEnd: string;
  rangeStart: string;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
}) {
  const weeks = buildContributionWeeks(history, {
    endDate: rangeEnd,
    startDate: rangeStart,
  }).map((week) => ({
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

  if (weeks.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/45 px-4 py-3">
        <div className="flex min-w-max gap-1.5">
          {weeks.map((week) => (
            <div className="grid gap-1" key={week.key}>
              {week.cells.map((cell) => (
                <button
                  aria-label={`Select ${cell.label}`}
                  className={cn(
                    "rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selectedDateKey === cell.date &&
                      "ring-1 ring-primary ring-offset-1"
                  )}
                  disabled={cell.totalCount === 0 && cell.status === "empty"}
                  key={cell.date}
                  onClick={() => onSelectDate(cell.date)}
                  type="button"
                >
                  <ContributionSquare cell={cell} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function getMonthRange(month: Date): { endDate: string; startDate: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  return {
    endDate: toDateKey(end),
    startDate: toDateKey(start),
  };
}

function getYearRange(year: number): { endDate: string; startDate: string } {
  return {
    endDate: `${year}-12-31`,
    startDate: `${year}-01-01`,
  };
}

function getMonthOffset(month: Date, offset: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function getDayStatusLabel(day: HistoryDay, isToday: boolean): string {
  const status = getActivityStatus(day.summary, isToday);

  if (status === "sick") {
    return "Sick";
  }

  if (status === "rest") {
    return "Rest";
  }

  if (status === "rescheduled") {
    return "Moved";
  }

  if (status === "freeze") {
    return "Freeze";
  }

  if (status === "complete") {
    return "Completed";
  }

  if (status === "in-progress") {
    return "Today";
  }

  return "Missed";
}

function TimelineDayRow({
  day,
  isSelected,
  isToday,
  onSelect,
}: {
  day: HistoryDay;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}) {
  const percent = getDailyCompletionPercent(day);
  const status = getActivityStatus(day.summary, isToday);
  const missedHabits = day.habits
    .filter((habit) => habit.frequency === "daily" && !habit.completed)
    .map((habit) => habit.name);

  return (
    <button
      className={cn(
        "grid w-full grid-cols-[72px_1fr_72px_88px_72px_24px] items-center gap-3 border-b border-l-2 border-b-border/55 border-l-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
        isSelected && "border-l-primary bg-primary/5"
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="font-medium text-foreground">
        {isToday ? "Today" : formatDateKey(day.date, { weekday: "short" })}
      </div>
      <div className="min-w-0">
        <p className="truncate text-muted-foreground">
          {formatDateKey(day.date, { day: "numeric", month: "short" })}
        </p>
      </div>
      <div className="font-medium text-foreground">{percent}%</div>
      <div className="text-muted-foreground">
        {formatFocusMinutes(day.focusMinutes)}
      </div>
      <Badge
        className={cn(
          "justify-self-start",
          HISTORY_STATUS_UI[status].badgeClassName
        )}
        variant="outline"
      >
        {getDayStatusLabel(day, isToday)}
      </Badge>
      <div className="flex justify-end">
        <span className="min-w-5 rounded-md bg-muted px-1.5 py-0.5 text-center text-xs font-medium text-muted-foreground">
          {missedHabits.length}
        </span>
      </div>
    </button>
  );
}

function TimelineHeaderRow() {
  return (
    <div className="grid grid-cols-[72px_1fr_72px_88px_72px_24px] items-center gap-3 border-b border-border/60 bg-muted/25 px-3 py-2 text-xs font-medium text-muted-foreground">
      <span>Day</span>
      <span>Date</span>
      <span>Complete</span>
      <span>Focus</span>
      <span>Status</span>
      <span className="text-right">Misses</span>
    </div>
  );
}

export function HistoryPage({
  history,
  historyYears,
  historyLoadError,
  isHistoryLoading,
  onLoadHistoryYears,
  onNavigateToToday,
  onSelectHistoryYear,
  todayDate,
  selectedHistoryYear,
  onSelectWeeklyReview,
  selectedWeeklyReview,
  weeklyReviewError,
  weeklyReviewOverview,
  weeklyReviewPhase,
  viewModel,
}: HistoryPageProps) {
  const [historyMode, setHistoryMode] = useState<HistoryViewMode>("timeline");
  const localViewModel = useHistoryViewState({
    history,
    historyYears,
    selectedHistoryYear,
    todayDate,
  });
  const {
    availableYears,
    filteredHistory,
    selectDateKey,
    selectedDay,
    setViewState,
    viewState,
  } = viewModel ?? localViewModel;
  const visibleMonth =
    viewState.visibleMonth ?? parseDateKey(`${viewState.selectedYear}-01-01`);
  const visibleMonthRange = useMemo(
    () => getMonthRange(visibleMonth),
    [visibleMonth]
  );
  const visibleMonthHistory = useMemo(
    () =>
      filteredHistory.filter(
        (day) =>
          day.date >= visibleMonthRange.startDate &&
          day.date <= visibleMonthRange.endDate
      ),
    [filteredHistory, visibleMonthRange]
  );
  const visibleMonthDays = useMemo(
    () =>
      visibleMonthHistory.toSorted((left, right) =>
        right.date.localeCompare(left.date)
      ),
    [visibleMonthHistory]
  );
  const yearRange = useMemo(
    () => getYearRange(viewState.selectedYear),
    [viewState.selectedYear]
  );
  const visibleMonthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const canShowPreviousMonth =
    visibleMonth.getMonth() > 0 ||
    availableYears.includes(visibleMonth.getFullYear() - 1);
  const canShowNextMonth =
    visibleMonth.getMonth() < 11 ||
    availableYears.includes(visibleMonth.getFullYear() + 1);
  const showMonth = (offset: number) => {
    const nextMonth = getMonthOffset(visibleMonth, offset);
    const nextYear = nextMonth.getFullYear();
    const nextMonthRange = getMonthRange(nextMonth);
    const nextMonthDate =
      history.find(
        (day) =>
          day.date >= nextMonthRange.startDate &&
          day.date <= nextMonthRange.endDate
      )?.date ?? null;

    setViewState((current) => ({
      ...current,
      selectedDateKey: nextMonthDate ?? current.selectedDateKey,
      selectedYear: nextYear,
      visibleMonth: nextMonth,
    }));

    if (nextYear !== viewState.selectedYear) {
      onSelectHistoryYear(nextYear);
    }
  };

  useEffect(() => {
    onLoadHistoryYears();
  }, [onLoadHistoryYears]);

  return (
    <LazyMotion features={domAnimation}>
      <Tabs
        className="w-full"
        onValueChange={(value) => setHistoryMode(value as HistoryViewMode)}
        value={historyMode}
      >
        <m.div
          animate="animate"
          className="grid gap-6"
          initial="initial"
          variants={staggerContainerVariants}
        >
          <m.section className="grid gap-5" variants={staggerItemVariants}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  History
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TabsList className="rounded-lg">
                  <TabsTrigger className="h-7 px-3 text-xs" value="timeline">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger className="h-7 px-3 text-xs" value="review">
                    Review
                  </TabsTrigger>
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" type="button" variant="outline">
                      {viewState.selectedYear}
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableYears.map((year) => (
                      <DropdownMenuItem
                        key={year}
                        onClick={() => {
                          const fallbackDate =
                            history.find((day) =>
                              day.date.startsWith(`${year}-`)
                            )?.date ?? null;

                          setViewState({
                            selectedDateKey: fallbackDate,
                            selectedYear: year,
                            visibleMonth: fallbackDate
                              ? parseDateKey(fallbackDate)
                              : undefined,
                          });
                          onSelectHistoryYear(year);
                        }}
                      >
                        {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {historyLoadError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {historyLoadError.message}
              </div>
            ) : null}
            {isHistoryLoading ? (
              <div className="rounded-md border border-border/60 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                Loading history...
              </div>
            ) : null}

            {historyMode === "timeline" ? (
              <ContributionGraph
                history={filteredHistory}
                rangeEnd={yearRange.endDate}
                rangeStart={yearRange.startDate}
                selectedDateKey={viewState.selectedDateKey}
                onSelectDate={selectDateKey}
              />
            ) : null}
          </m.section>

          <TabsContent value={"timeline" satisfies HistoryViewMode}>
            <m.section className="grid gap-5" variants={staggerItemVariants}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {visibleMonthLabel}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {visibleMonthDays.length} tracked days
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    aria-label="Show previous month"
                    disabled={!canShowPreviousMonth}
                    onClick={() => showMonth(-1)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-20 text-center text-sm font-medium text-muted-foreground">
                    {visibleMonth.toLocaleDateString(undefined, {
                      month: "long",
                    })}
                  </span>
                  <Button
                    aria-label="Show next month"
                    disabled={!canShowNextMonth}
                    onClick={() => showMonth(1)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {visibleMonthDays.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-card/55 px-2">
                    <TimelineHeaderRow />
                    {visibleMonthDays.map((day) => (
                      <TimelineDayRow
                        day={day}
                        isSelected={viewState.selectedDateKey === day.date}
                        isToday={day.date === todayDate}
                        key={day.date}
                        onSelect={() => selectDateKey(day.date)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border/60 bg-card/45 px-4 py-8 text-center text-sm text-muted-foreground">
                    No history for this month.
                  </div>
                )}
              </div>

              <div className="lg:hidden">
                <HistoryDayPanel
                  isToday={selectedDay?.date === todayDate}
                  onNavigateToToday={onNavigateToToday}
                  selectedDay={selectedDay}
                />
              </div>
            </m.section>
          </TabsContent>

          <TabsContent value={"review" satisfies HistoryViewMode}>
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
        </m.div>
      </Tabs>
    </LazyMotion>
  );
}
