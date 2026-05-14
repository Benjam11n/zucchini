import { ArrowDownRight } from "lucide-react";

import { Badge } from "@/renderer/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { HabitCategoryMarker } from "@/renderer/shared/components/ui/habit-category-marker";
import { TextWithTooltip } from "@/renderer/shared/components/ui/text-with-tooltip";
import {
  getHabitCategoryLabel,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

interface WeeklyReviewMostMissedCardProps {
  habits: WeeklyReviewHabitMetric[];
}

export function WeeklyReviewMostMissedCard({
  habits,
}: WeeklyReviewMostMissedCardProps) {
  const categoryPreferences = useHabitCategoryPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most missed habits</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {habits.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
            No misses last week. Keep the rhythm.
          </div>
        ) : (
          habits.map((habit) => {
            const categoryLabel = getHabitCategoryLabel(
              habit.category,
              categoryPreferences
            );

            return (
              <div
                aria-label={`${habit.name}, ${categoryLabel}: ${habit.missedOpportunities} missed of ${habit.opportunities} opportunities, ${habit.completionRate}% completion`}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-2 hover:bg-muted/25"
                key={habit.habitId}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <HabitCategoryMarker
                      category={habit.category}
                      variant="dot"
                    />
                    <TextWithTooltip
                      className="text-sm font-medium text-foreground"
                      content={habit.name}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {habit.missedOpportunities} missed of {habit.opportunities}{" "}
                    opportunities
                  </p>
                </div>
                <Badge className="shrink-0" variant="outline">
                  <ArrowDownRight className="size-3.5" />
                  {habit.completionRate}%
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
