import { WeeklyReviewChartCard } from "@/renderer/features/weekly-review/components/weekly-review-chart-card";
import { buildWeeklyReviewHabitChartState } from "@/renderer/features/weekly-review/lib/weekly-review-habit-chart";
import { HabitCategoryMarker } from "@/renderer/shared/components/ui/habit-category-marker";
import { TextWithTooltip } from "@/renderer/shared/components/ui/text-with-tooltip";
import { TooltipProvider } from "@/renderer/shared/components/ui/tooltip";
import {
  getHabitCategoryLabel,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { WeeklyReviewHabitHeatmapRow } from "@/shared/domain/weekly-review";

import { EmptyHeatmapState } from "./empty-heatmap-state";
import { HeatmapCell } from "./heatmap-cell";

interface WeeklyReviewHabitChartImplProps {
  heatmapRows: WeeklyReviewHabitHeatmapRow[];
}

export function WeeklyReviewHabitChartImpl({
  heatmapRows,
}: WeeklyReviewHabitChartImplProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const { chartHeight, viewportHeight, visibleRows } =
    buildWeeklyReviewHabitChartState(heatmapRows);
  const weekdayLabels = visibleRows[0]?.cells.map(
    (cell) => cell.weekdayLabel
  ) ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <WeeklyReviewChartCard title="Habit completion">
      {visibleRows.length === 0 ? (
        <EmptyHeatmapState />
      ) : (
        <TooltipProvider delayDuration={100}>
          <div
            className="overflow-auto pr-2"
            style={{
              maxHeight: `${viewportHeight}px`,
              minHeight: `${Math.min(viewportHeight, chartHeight)}px`,
            }}
          >
            <div className="min-w-[35rem]" style={{ minHeight: chartHeight }}>
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(10rem,1fr)_repeat(7,1.75rem)_5.75rem] gap-2 border-border/70 border-b bg-card/95 pb-2 text-[0.68rem] text-muted-foreground backdrop-blur">
                <div>Habit</div>
                {weekdayLabels.map((weekday) => (
                  <div className="text-center" key={weekday}>
                    {weekday}
                  </div>
                ))}
                <div className="text-right">Total</div>
              </div>
              <div className="grid gap-1 pt-2">
                {visibleRows.map((row) => {
                  const categoryLabel = getHabitCategoryLabel(
                    row.category,
                    categoryPreferences
                  );

                  return (
                    <div
                      aria-label={`${row.name}, ${categoryLabel}: ${row.completedOpportunities} of ${row.opportunities} opportunities, ${row.completionRate}%`}
                      className="grid grid-cols-[minmax(10rem,1fr)_repeat(7,1.75rem)_5.75rem] items-center gap-2 rounded-md px-1 py-1.5 hover:bg-muted/25"
                      key={row.habitId}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <HabitCategoryMarker
                          category={row.category}
                          variant="dot"
                        />
                        <TextWithTooltip
                          className="text-sm font-medium"
                          content={row.name}
                        />
                      </div>
                      {row.cells.map((cell) => (
                        <HeatmapCell
                          cell={cell}
                          habitName={row.name}
                          key={`${row.habitId}-${cell.date}`}
                        />
                      ))}
                      <div className="text-right">
                        <div className="text-sm font-medium tabular-nums">
                          {row.completedOpportunities}/{row.opportunities}
                        </div>
                        <div className="text-[0.68rem] text-muted-foreground tabular-nums">
                          {row.completionRate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TooltipProvider>
      )}
    </WeeklyReviewChartCard>
  );
}
