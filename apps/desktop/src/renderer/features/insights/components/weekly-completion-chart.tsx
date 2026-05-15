import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import type { InsightsWeeklyCompletion } from "@/shared/domain/insights";

export function WeeklyCompletionChart({
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
            <div className="grid min-w-0 gap-2" key={week.weekStart}>
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
