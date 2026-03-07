import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHubCalendar } from "@/components/ui/git-hub-calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DailySummary } from "@/shared/domain/streak";
import {
  buildContributionWeeks,
  formatContributionLabel,
  formatDateKey,
  getActivityBadgeLabel,
  getActivitySummary,
  getHistoryStats,
  getRecentHistory,
  HISTORY_RANGE_OPTIONS,
  isHistoryRange,
} from "./history-page.utils";
import type { HistoryRange } from "./history-page.utils";

interface HistoryPageProps {
  history: DailySummary[];
}

export function HistoryPage({ history }: HistoryPageProps) {
  const [historyRange, setHistoryRange] = useState<HistoryRange>("week");
  const stats = getHistoryStats(history);
  const recentDays = getRecentHistory(history, historyRange);
  const selectedRange =
    HISTORY_RANGE_OPTIONS.find((option) => option.value === historyRange) ??
    HISTORY_RANGE_OPTIONS[0];
  const calendarWeeks = buildContributionWeeks(history).map((week) => ({
    ...week,
    cells: week.cells.map((cell) => ({
      date: cell.date,
      isToday: cell.isToday,
      label: formatContributionLabel(cell),
      status: cell.status,
    })),
  }));

  return (
    <div className="grid gap-6">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardDescription>History</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.completionRate}% completion</Badge>
            <Badge variant="outline">{stats.completedDays} complete</Badge>
            <Badge variant="secondary">{stats.freezeDays} freeze saves</Badge>
            <Badge variant="outline">{stats.missedDays} missed</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-5">
            <GitHubCalendar weeks={calendarWeeks} />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="gap-4">
            <div className="space-y-1">
              <CardDescription>Recent log</CardDescription>
              <CardTitle>{selectedRange.title}</CardTitle>
            </div>

            <Tabs
              className="gap-3"
              onValueChange={(value) =>
                setHistoryRange(isHistoryRange(value) ? value : "week")
              }
              value={historyRange}
            >
              <TabsList className="w-fit">
                {HISTORY_RANGE_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDays.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
                No tracked days in this range yet.
              </div>
            ) : (
              recentDays.map((day) => (
                <div
                  key={day.date}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {formatDateKey(day.date, {
                        day: "numeric",
                        month: "short",
                        weekday: "short",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getActivitySummary(day)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Streak after day: {day.streakCountAfterDay}
                    </p>
                  </div>

                  <Badge variant={day.freezeUsed ? "secondary" : "outline"}>
                    {getActivityBadgeLabel(day)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
