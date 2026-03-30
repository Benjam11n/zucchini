import { m } from "framer-motion";
import type { ComponentProps, Dispatch, SetStateAction } from "react";

import { HistoryCalendarCard } from "@/renderer/features/history/components/history-calendar-card";
import { HistoryDayPanel } from "@/renderer/features/history/components/history-day-panel";
import { HISTORY_METRIC_BADGE_CLASS_NAMES } from "@/renderer/features/history/history-status-ui";
import type {
  HistoryCalendarContextValue,
  HistoryPageProps,
  HistoryStats,
} from "@/renderer/features/history/history.types";
import type { HistoryViewState } from "@/renderer/features/history/use-history-view-state";
import { GitHubCalendar } from "@/renderer/shared/components/github-calendar";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { hoverLift, tapPress } from "@/renderer/shared/lib/motion";
import { parseDateKey } from "@/shared/utils/date";

export function HistoryOverviewPanel({
  availableYears,
  calendarWeeks,
  history,
  historyCalendarContextValue,
  historyLoadError,
  historyScope,
  historyByDate,
  isHistoryLoading,
  onLoadOlderHistory,
  onNavigateToToday,
  selectedDay,
  setViewState,
  stats,
  todayDate,
  viewState,
}: {
  availableYears: number[];
  calendarWeeks: ComponentProps<typeof GitHubCalendar>["weeks"];
  history: HistoryPageProps["history"];
  historyCalendarContextValue: HistoryCalendarContextValue;
  historyLoadError: HistoryPageProps["historyLoadError"];
  historyScope: HistoryPageProps["historyScope"];
  historyByDate: HistoryCalendarContextValue["historyByDate"];
  isHistoryLoading: HistoryPageProps["isHistoryLoading"];
  onLoadOlderHistory: HistoryPageProps["onLoadOlderHistory"];
  onNavigateToToday: HistoryPageProps["onNavigateToToday"];
  selectedDay: HistoryPageProps["history"][number] | null;
  setViewState: Dispatch<SetStateAction<HistoryViewState>>;
  stats: HistoryStats;
  todayDate: string;
  viewState: HistoryViewState;
}) {
  return (
    <m.div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                {
                  className: HISTORY_METRIC_BADGE_CLASS_NAMES.completionRate,
                  label: `${stats.completionRate}% completion`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASS_NAMES.completedDays,
                  label: `${stats.completedDays} complete`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASS_NAMES.freezeDays,
                  label: `${stats.freezeDays} freeze saves`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASS_NAMES.missedDays,
                  label: `${stats.missedDays} missed`,
                },
              ].map((statBadge) => (
                <m.div
                  key={statBadge.label}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <Badge className={statBadge.className} variant="outline">
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
                    const nextYear = Number.parseInt(event.target.value, 10);
                    const fallbackDate =
                      history.find(
                        (day) =>
                          Number.parseInt(day.date.slice(0, 4), 10) === nextYear
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
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
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
          onNavigateToToday={onNavigateToToday}
          selectedDay={selectedDay}
          isToday={selectedDay?.date === todayDate}
        />
      </div>
    </m.div>
  );
}
