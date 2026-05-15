import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { HabitCategoryMarker } from "@/renderer/shared/components/ui/habit-category-marker";
import { Sparkline } from "@/renderer/shared/components/ui/sparkline";
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
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import type { InsightsHabitLeaderboardItem } from "@/shared/domain/insights";

export function HabitLeaderboard({
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
                <TableHead className="w-32 px-2">Completion</TableHead>
                <TableHead className="hidden w-36 px-0 pl-3 sm:table-cell">
                  Trend
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.map((habit) => (
                <TableRow
                  className="border-border/50 hover:bg-muted/20"
                  key={habit.habitId}
                >
                  <TableCell className="px-0 py-4 pr-2 text-muted-foreground tabular-nums">
                    {habit.rank}
                  </TableCell>
                  <TableCell className="min-w-0 p-4 font-medium text-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      <HabitCategoryMarker
                        category={habit.category}
                        variant="dot"
                      />
                      <TextWithTooltip content={habit.name} />
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="grid gap-0.5">
                      <span className="text-lg leading-none tabular-nums">
                        {habit.completionRate}%
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {habit.completedCount} of {habit.totalCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-0 py-4 pl-3 text-primary sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label={`${habit.name} recent trend: ${habit.trend.join("%, ")}%`}
                          className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          type="button"
                        >
                          <Sparkline className="h-8" points={habit.trend} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-72 leading-relaxed">
                        Overall: {habit.completedCount}/{habit.totalCount}{" "}
                        completed. Recent trend: {habit.trend.join("%, ")}%
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
