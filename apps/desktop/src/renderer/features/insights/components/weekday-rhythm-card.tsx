import { Clock3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { cn } from "@/renderer/shared/lib/class-names";
import type { InsightsWeekdayRhythm } from "@/shared/domain/insights";

function getRhythmCellClassName(intensity: number): string {
  if (intensity >= 75) {
    return "bg-primary text-primary-foreground";
  }

  if (intensity >= 50) {
    return "bg-primary/70 text-primary-foreground";
  }

  if (intensity >= 25) {
    return "bg-primary/35 text-foreground";
  }

  if (intensity > 0) {
    return "bg-primary/15 text-muted-foreground";
  }

  return "bg-muted/50 text-muted-foreground";
}

export function WeekdayRhythmCard({
  rhythm,
}: {
  rhythm: InsightsWeekdayRhythm;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />
            {rhythm.title}
          </CardTitle>
          <CardDescription>{rhythm.subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-[4.75rem_repeat(7,minmax(0,1fr))] gap-2 text-xs">
          <div />
          {rhythm.weekdayLabels.map((weekday) => (
            <div className="text-center text-muted-foreground" key={weekday}>
              {weekday}
            </div>
          ))}
          {rhythm.timeOfDayLabels.map((timeOfDayLabel, rowIndex) => {
            const [label, subtitle] = timeOfDayLabel.split("\n");
            const rowCells = rhythm.cells.slice(rowIndex * 7, rowIndex * 7 + 7);

            return (
              <div className="contents" key={timeOfDayLabel}>
                <div className="self-center">
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="text-[0.68rem] text-muted-foreground">
                    {subtitle}
                  </div>
                </div>
                {rowCells.map((cell) => (
                  <div
                    aria-label={cell.label}
                    className={cn(
                      "grid h-9 min-w-0 place-items-center rounded-md text-[0.68rem] font-medium tabular-nums",
                      getRhythmCellClassName(cell.intensity)
                    )}
                    key={`${cell.timeOfDay}-${cell.weekday}`}
                    title={cell.label}
                  >
                    {cell.completionCount > 0 ? cell.completionCount : ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Completions</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted/50" />0
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary/15" /> Low
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary/70" /> High
          </span>
          <span className="ml-auto text-[0.68rem]">
            Peak: {rhythm.maxCompletionCount}
          </span>
        </div>
        {rhythm.hasData ? null : (
          <p className="text-sm text-muted-foreground">
            Complete a few habits to reveal your time-of-day rhythm.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
