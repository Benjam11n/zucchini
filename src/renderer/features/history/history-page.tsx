/**
 * History tab page.
 *
 * This screen lets the user inspect past days and switch into weekly review
 * mode, combining the calendar browser, day detail panel, and deferred charts.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { BarChart3, CalendarDays } from "lucide-react";

import { HistoryOverviewPanel } from "@/renderer/features/history/components/history-overview-panel";
import { WeeklyReviewSection } from "@/renderer/features/history/components/weekly-review-section";
import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import {
  buildContributionWeeks,
  formatContributionLabel,
} from "@/renderer/features/history/lib/history-contributions";
import { useHistoryViewState } from "@/renderer/features/history/use-history-view-state";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/renderer/shared/ui/tabs";

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
  const {
    availableYears,
    filteredHistory,
    historyByDate,
    historyCalendarContextValue,
    selectedDay,
    setViewState,
    stats,
    viewState,
  } = useHistoryViewState({
    history,
    todayDate,
  });
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
            <HistoryOverviewPanel
              availableYears={availableYears}
              calendarWeeks={calendarWeeks}
              history={history}
              historyByDate={historyByDate}
              historyCalendarContextValue={historyCalendarContextValue}
              historyLoadError={historyLoadError}
              historyScope={historyScope}
              isHistoryLoading={isHistoryLoading}
              onLoadOlderHistory={onLoadOlderHistory}
              selectedDay={selectedDay}
              setViewState={setViewState}
              stats={stats}
              todayDate={todayDate}
              viewState={viewState}
            />
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
