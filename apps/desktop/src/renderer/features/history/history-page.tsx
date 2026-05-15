/**
 * History tab page.
 *
 * Shows the selected year timeline and weekly review in a compact layout that
 * pairs with the shell right sidebar.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { HistoryContributionGraph } from "@/renderer/features/history/components/history-contribution-graph";
import { HistoryMobileSummaryDialog } from "@/renderer/features/history/components/history-mobile-summary-dialog";
import { HistoryPageHeader } from "@/renderer/features/history/components/history-page-header";
import type { HistoryViewMode } from "@/renderer/features/history/components/history-page-header";
import { HistoryTimelineContent } from "@/renderer/features/history/components/history-timeline-content";
import { WeeklyReviewSection } from "@/renderer/features/history/components/weekly-review-section";
import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import { useHistoryViewState } from "@/renderer/features/history/use-history-view-state";
import { Tabs, TabsContent } from "@/renderer/shared/components/ui/tabs";
import { useMediaQuery } from "@/renderer/shared/hooks/use-media-query";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import {
  formatDate,
  getDateKeyMonth,
  getMonthOffset,
  getMonthRange,
  getYearRange,
  parseDateKey,
} from "@/shared/utils/date";

export function HistoryPage({
  contributionHistory,
  history,
  historyYears,
  historyLoadError,
  onLoadHistoryYears,
  onLoadWeeklyReviewOverview,
  onSelectHistoryMonth,
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
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const localViewModel = useHistoryViewState({
    history,
    historyYears,
    selectedHistoryYear,
    todayDate,
  });
  const {
    availableYears,
    filteredHistory,
    monthStats,
    nextDateKey,
    previousDateKey,
    selectDateKey,
    selectedDay: selectedSummaryDay,
    setViewState,
    trendPoints,
    viewState,
  } = viewModel ?? localViewModel;
  const isNarrowHistoryLayout = useMediaQuery("(max-width: 1023px)");
  const visibleMonth =
    viewState.visibleMonth ?? parseDateKey(`${viewState.selectedYear}-01-01`);

  useEffect(() => {
    onLoadHistoryYears();
  }, [onLoadHistoryYears]);

  useEffect(() => {
    if (!(isNarrowHistoryLayout && historyMode === "timeline")) {
      setIsMobileSummaryOpen(false);
    }
  }, [historyMode, isNarrowHistoryLayout]);

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
  const visibleMonthLabel = formatDate(visibleMonth, {
    month: "long",
    year: "numeric",
  });
  const canShowPreviousMonth =
    visibleMonth.getMonth() > 0 ||
    availableYears.includes(visibleMonth.getFullYear() - 1);
  const canShowNextMonth =
    visibleMonth.getMonth() < 11 ||
    availableYears.includes(visibleMonth.getFullYear() + 1);
  const selectHistoryDate = (dateKey: string) => {
    if (filteredHistory.some((day) => day.date === dateKey)) {
      selectDateKey(dateKey);
      if (isNarrowHistoryLayout) {
        setIsMobileSummaryOpen(true);
      }
      return;
    }

    const nextMonth = parseDateKey(dateKey);
    setViewState((current) => ({
      ...current,
      selectedDateKey: dateKey,
      selectedYear: nextMonth.getFullYear(),
      visibleMonth: nextMonth,
    }));
    onSelectHistoryMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
    if (isNarrowHistoryLayout) {
      setIsMobileSummaryOpen(true);
    }
  };
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
      selectedDateKey: nextMonthDate,
      selectedYear: nextYear,
      visibleMonth: nextMonth,
    }));

    onSelectHistoryMonth(nextYear, nextMonth.getMonth() + 1);
  };
  const selectHistoryYear = (year: number) => {
    const fallbackDate =
      history.find((day) => day.date.startsWith(`${year}-`))?.date ?? null;

    setViewState({
      selectedDateKey: fallbackDate,
      selectedYear: year,
      visibleMonth: fallbackDate ? parseDateKey(fallbackDate) : undefined,
    });
    onSelectHistoryMonth(
      year,
      fallbackDate ? getDateKeyMonth(fallbackDate) : visibleMonth.getMonth() + 1
    );
  };
  const isMobileSummaryDialogOpen =
    isNarrowHistoryLayout &&
    historyMode === "timeline" &&
    isMobileSummaryOpen &&
    selectedSummaryDay !== null;

  return (
    <LazyMotion features={domAnimation}>
      <Tabs
        className="w-full"
        onValueChange={(value) => {
          const nextMode = value as HistoryViewMode;
          setHistoryMode(nextMode);

          if (nextMode === "review") {
            onLoadWeeklyReviewOverview();
          }
        }}
        value={historyMode}
      >
        <m.div
          animate="animate"
          className="grid gap-6"
          initial="initial"
          variants={staggerContainerVariants}
        >
          <m.section className="grid gap-5" variants={staggerItemVariants}>
            <HistoryPageHeader
              availableYears={availableYears}
              canShowNextMonth={canShowNextMonth}
              canShowPreviousMonth={canShowPreviousMonth}
              historyMode={historyMode}
              selectedYear={viewState.selectedYear}
              visibleMonth={visibleMonth}
              onSelectYear={selectHistoryYear}
              onShowMonth={showMonth}
            />

            {historyLoadError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {historyLoadError.message}
              </div>
            ) : null}
            {historyMode === "timeline" ? (
              <HistoryContributionGraph
                contributionHistory={contributionHistory}
                fallbackHistory={filteredHistory}
                rangeEnd={yearRange.endDate}
                rangeStart={yearRange.startDate}
                selectedDateKey={viewState.selectedDateKey}
                onSelectDate={selectHistoryDate}
              />
            ) : null}
          </m.section>

          <TabsContent value={"timeline" satisfies HistoryViewMode}>
            <HistoryTimelineContent
              selectedDateKey={viewState.selectedDateKey}
              selectHistoryDate={selectHistoryDate}
              todayDate={todayDate}
              visibleMonthDays={visibleMonthDays}
              visibleMonthLabel={visibleMonthLabel}
            />
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
      <HistoryMobileSummaryDialog
        monthStats={monthStats}
        nextDateKey={nextDateKey}
        open={isMobileSummaryDialogOpen}
        previousDateKey={previousDateKey}
        selectedDay={selectedSummaryDay}
        todayDate={todayDate}
        trendPoints={trendPoints}
        onOpenChange={setIsMobileSummaryOpen}
        onSelectDate={selectHistoryDate}
      />
    </LazyMotion>
  );
}
