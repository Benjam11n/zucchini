import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GitHubCalendar } from "@/components/custom/github-calendar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { HISTORY_METRIC_BADGE_CLASSNAMES } from "@/renderer/lib/history-status";
import {
  hoverLift,
  staggerContainerVariants,
  staggerItemVariants,
  tapPress,
} from "@/renderer/lib/motion";

import { HistoryCalendarCard } from "../features/history/history-calendar-card";
import { HistoryDayPanel } from "../features/history/history-day-panel";
import type {
  HistoryCalendarContextValue,
  HistoryPageProps,
} from "../features/history/types";
import {
  buildContributionWeeks,
  formatContributionLabel,
  getHistoryDayLookup,
  getHistoryStats,
  parseDateKey,
} from "./history-page.utils";

export function HistoryPage({ history }: HistoryPageProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    history[0]?.date ?? null
  );
  const [visibleMonth, setVisibleMonth] = useState<Date | undefined>(
    history[0] ? parseDateKey(history[0].date) : undefined
  );
  const stats = getHistoryStats(history);
  const historyByDate = useMemo(() => getHistoryDayLookup(history), [history]);
  const selectedDay =
    (selectedDateKey ? historyByDate.get(selectedDateKey) : null) ??
    history[0] ??
    null;
  const calendarWeeks = buildContributionWeeks(history).map((week) => ({
    ...week,
    cells: week.cells.map((cell) => ({
      date: cell.date,
      isToday: cell.isToday,
      label: formatContributionLabel(cell),
      status: cell.status,
    })),
  }));

  useEffect(() => {
    const fallbackDate = history[0]?.date ?? null;

    if (!fallbackDate) {
      setSelectedDateKey(null);
      setVisibleMonth(undefined);
      return;
    }

    setSelectedDateKey((current) =>
      current && history.some((day) => day.date === current)
        ? current
        : fallbackDate
    );
    setVisibleMonth((current) => current ?? parseDateKey(fallbackDate));
  }, [history]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setVisibleMonth(parseDateKey(dateKey));
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
    <motion.div
      animate="animate"
      className="grid gap-6"
      initial="initial"
      variants={staggerContainerVariants}
    >
      <motion.div variants={staggerItemVariants}>
        <Card>
          <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardDescription>History</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.completionRate,
                  label: `${stats.completionRate}% completion`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.completedDays,
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
                <motion.div
                  key={statBadge.label}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <Badge className={statBadge.className} variant="outline">
                    {statBadge.label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]"
        variants={staggerItemVariants}
      >
        <Card>
          <CardContent className="space-y-5">
            <GitHubCalendar weeks={calendarWeeks} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <HistoryCalendarCard
            historyByDate={historyByDate}
            historyCalendarContextValue={historyCalendarContextValue}
            onSelectDateKey={setSelectedDateKey}
            selectedDay={selectedDay}
            setVisibleMonth={setVisibleMonth}
            visibleMonth={visibleMonth}
          />
          <HistoryDayPanel selectedDay={selectedDay} />
        </div>
      </motion.div>
    </motion.div>
  );
}
